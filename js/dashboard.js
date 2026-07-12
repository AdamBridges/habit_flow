document.addEventListener("DOMContentLoaded", () => {
  const contentWrap = document.getElementById("dashboard-content");
  const emptyState = document.getElementById("dashboard-empty");
  const overviewList = document.getElementById("overview-stats");
  const todayForm = document.getElementById("today-form");
  const perfMost = document.getElementById("perf-most");
  const perfLeast = document.getElementById("perf-least");
  const heatmapHeadRow = document.getElementById("heatmap-head-row");
  const heatmapBody = document.getElementById("heatmap-body");

  if (!contentWrap) {
    return;
  }

  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const WEEKS_SHOWN = 4;

  function parseDate(str) {
    return new Date(str + "T00:00:00Z");
  }

  function formatDate(date) {
    return date.toISOString().split("T")[0];
  }

  function addDays(str, n) {
    const date = parseDate(str);
    date.setUTCDate(date.getUTCDate() + n);
    return formatDate(date);
  }

  function dayOfWeek(str) {
    return parseDate(str).getUTCDay();
  }

  function render() {
    const habits = loadHabits();
    const today = getTodayDate();

    // No habits at all -> show the empty message, hide the dashboard body.
    if (habits.length === 0) {
      contentWrap.hidden = true;
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;
    contentWrap.hidden = false;

    const validIds = new Set(habits.map((h) => h.id));
    const completions = loadCompletions();
    
    function completedCount(date) {
      const ids = completions[date] || [];
      return ids.filter((id) => validIds.has(id)).length;
    }

    function habitDoneOn(habitId, date) {
      const ids = completions[date] || [];
      return ids.includes(habitId);
    }

    renderOverview(habits, today, completedCount);
    renderTodayChecklist(habits, today);
    renderPerformance(habits, today, habitDoneOn);
    renderHeatmap(habits, today, completedCount);
  }

  function renderOverview(habits, today, completedCount) {
    // Current streak: number of consecutive days (ending today, or yesterday if
    // today has nothing yet) on which at least one habit was completed.
    let currentStreak = 0;
    let cursor = today;
    if (completedCount(today) === 0) {
      cursor = addDays(today, -1);
    }
    while (completedCount(cursor) >= 1) {
      currentStreak++;
      cursor = addDays(cursor, -1);
    }

    const activeDays = Object.keys(loadCompletions())
      .filter((date) => completedCount(date) >= 1)
      .sort();

    let longestStreak = 0;
    let runLength = 0;
    let previous = null;
    for (const date of activeDays) {
      if (previous !== null && date === addDays(previous, 1)) {
        runLength++;
      } else {
        runLength = 1;
      }
      longestStreak = Math.max(longestStreak, runLength);
      previous = date;
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    const doneToday = completedCount(today);
    const total = habits.length;

    const stats = [
      ["Current streak", `${currentStreak} ${plural(currentStreak, "day")}`],
      ["Today's progress", `${doneToday} of ${total} ${plural(total, "habit")} completed`],
      ["Habits tracked", String(total)],
      ["Longest streak", `${longestStreak} ${plural(longestStreak, "day")}`],
    ];

    overviewList.innerHTML = "";
    for (const [label, value] of stats) {
      const li = document.createElement("li");
      const strong = document.createElement("strong");
      strong.textContent = label + ": ";
      li.append(strong, value);
      overviewList.appendChild(li);
    }
  }

  function renderTodayChecklist(habits, today) {
    todayForm.innerHTML = "";

    habits.forEach((habit) => {
      const row = document.createElement("p");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = "today-habit-" + habit.id;
      checkbox.checked = isHabitCompleted(habit.id, today);

      const label = document.createElement("label");
      label.setAttribute("for", checkbox.id);
      label.textContent = habit.name;

      const category = document.createElement("em");
      category.textContent = "(" + (habit.category || "Other") + ")";

      // Ticking or unticking saves the change and re-renders so the streak,
      // progress count and heatmap all update immediately.
      checkbox.addEventListener("change", () => {
        setHabitCompletion(habit.id, today, checkbox.checked);
        render();
      });

      row.append(checkbox, label, "  ", category);
      todayForm.appendChild(row);
    });
  }

  function renderPerformance(habits, today, habitDoneOn) {
    const scored = habits.map((habit) => {
      return {
        habit,
        rate30: completionRate(habit, today, 30, habitDoneOn),
        thisWeek: completionRate(habit, today, 7, habitDoneOn),
        lastWeek: completionRateBetween(habit, addDays(today, -13), addDays(today, -7), habitDoneOn),
      };
    });

    // Best-performing first.
    scored.sort((a, b) => b.rate30.rate - a.rate30.rate);

    // Split the list down the middle: the stronger half are "most consistent",
    // the rest are "least consistent".
    const half = Math.ceil(scored.length / 2);
    const most = scored.slice(0, half);
    const least = scored.slice(half);

    fillPerformanceList(perfMost, most);
    fillPerformanceList(perfLeast, least);
  }

  function completionRate(habit, today, windowDays, habitDoneOn) {
    const start = addDays(today, -(windowDays - 1));
    return completionRateBetween(habit, start, today, habitDoneOn);
  }

  /**
   * Completion rate for a habit across an inclusive date range [fromDate, toDate],
   * ignoring any days before the habit existed.
   */
  function completionRateBetween(habit, fromDate, toDate, habitDoneOn) {
    // Don't count days before the habit was created.
    const effectiveFrom = habit.startDate && habit.startDate > fromDate ? habit.startDate : fromDate;

    let applicableDays = 0;
    let completedDays = 0;

    let cursor = effectiveFrom;
    while (cursor <= toDate) {
      applicableDays++;
      if (habitDoneOn(habit.id, cursor)) {
        completedDays++;
      }
      cursor = addDays(cursor, 1);
    }

    const rate = applicableDays === 0 ? 0 : completedDays / applicableDays;
    return { rate, applicableDays };
  }

  /** Fills one <ol> with performance <li> items, or a "None yet" line. */
  function fillPerformanceList(listEl, entries) {
    listEl.innerHTML = "";

    if (entries.length === 0) {
      const li = document.createElement("li");
      li.textContent = "None yet";
      li.style.color = "var(--text-muted)";
      listEl.appendChild(li);
      return;
    }

    entries.forEach(({ habit, rate30, thisWeek, lastWeek }) => {
      const percent = Math.round(rate30.rate * 100);
      const li = document.createElement("li");
      li.append(`${habit.name} — ${percent}% completion`);

      // Week-over-week change. If there's no "last week" data yet (a brand new
      // habit), label it "new" instead of showing a misleading arrow.
      if (lastWeek.applicableDays === 0) {
        const tag = document.createElement("span");
        tag.textContent = "  new";
        tag.style.color = "var(--text-muted)";
        li.appendChild(tag);
      } else {
        const changePoints = Math.round((thisWeek.rate - lastWeek.rate) * 100);
        const tag = document.createElement("span");
        if (changePoints > 0) {
          tag.textContent = `  ▲ +${changePoints}%`;
          tag.style.color = "var(--success)";
        } else if (changePoints < 0) {
          tag.textContent = `  ▼ ${changePoints}%`;
          tag.style.color = "var(--text-muted)";
        } else {
          tag.textContent = "  no change";
          tag.style.color = "var(--text-muted)";
        }
        li.appendChild(tag);
      }

      listEl.appendChild(li);
    });
  }

  function renderHeatmap(habits, today, completedCount) {
    const total = habits.length;

    // Find the Monday of the current week, then step back so we show four full
    // weeks ending with the current one.
    const dow = dayOfWeek(today);
    const daysSinceMonday = dow === 0 ? 6 : dow - 1;
    const mondayThisWeek = addDays(today, -daysSinceMonday);
    const startMonday = addDays(mondayThisWeek, -7 * (WEEKS_SHOWN - 1));

    heatmapHeadRow.querySelectorAll("th:not(:first-child)").forEach((th) => th.remove());
    for (let w = 0; w < WEEKS_SHOWN; w++) {
      const weekMonday = addDays(startMonday, 7 * w);
      const d = parseDate(weekMonday);
      const th = document.createElement("th");
      th.textContent = `${MONTH_LABELS[d.getUTCMonth()]} ${d.getUTCDate()}`;
      heatmapHeadRow.appendChild(th);
    }

    
    heatmapBody.innerHTML = "";
    for (let r = 0; r < 7; r++) {
      const tr = document.createElement("tr");

      const th = document.createElement("th");
      th.textContent = DAY_LABELS[r];
      tr.appendChild(th);

      for (let w = 0; w < WEEKS_SHOWN; w++) {
        const date = addDays(addDays(startMonday, 7 * w), r);
        const td = document.createElement("td");

        if (date > today) {
          td.title = `${date} — upcoming`;
          td.classList.add("future");
        } else {
          const done = completedCount(date);
          td.setAttribute("data-level", String(intensityLevel(done, total)));
          td.title = `${date}: ${done} of ${total} completed`;
        }

        tr.appendChild(td);
      }

      heatmapBody.appendChild(tr);
    }
  }

  function intensityLevel(done, total) {
    if (total === 0 || done === 0) {
      return 0;
    }
    const ratio = done / total;
    if (ratio <= 0.34) return 1;
    if (ratio <= 0.67) return 2;
    return 3;
  }

  function plural(count, word) {
    return count === 1 ? word : word + "s";
  }

  render();
});
