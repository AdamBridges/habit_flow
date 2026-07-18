(() => {
  const progressMessage = document.getElementById("progress-message");
  const contentSections = document.querySelectorAll("[data-progress-content]");
  const weeklyCompletion = document.getElementById("weekly-completion");
  const weeklyCompletionDetail = document.getElementById("weekly-completion-detail");
  const bestCurrentStreak = document.getElementById("best-current-streak");
  const bestCurrentStreakDetail = document.getElementById("best-current-streak-detail");
  const monthlyAverage = document.getElementById("monthly-average");
  const weeklyProgressBody = document.getElementById("weekly-progress-body");
  const monthlyProgressList = document.getElementById("monthly-progress-list");
  const streakProgressBody = document.getElementById("streak-progress-body");
  const weekdayHeaders = document.querySelectorAll("[data-weekday]");
  const previousWeekButton = document.getElementById("previous-week");
  const currentWeekButton = document.getElementById("current-week");
  const nextWeekButton = document.getElementById("next-week");
  const weekRange = document.getElementById("week-range");

  if (
    !progressMessage ||
    !weeklyCompletion ||
    !weeklyCompletionDetail ||
    !bestCurrentStreak ||
    !bestCurrentStreakDetail ||
    !monthlyAverage ||
    !weeklyProgressBody ||
    !monthlyProgressList ||
    !streakProgressBody ||
    !previousWeekButton ||
    !currentWeekButton ||
    !nextWeekButton ||
    !weekRange ||
    weekdayHeaders.length !== 7
  ) {
    return;
  }

  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let selectedWeekStart = null;

  function parseDate(dateString) {
    return new Date(`${dateString}T00:00:00Z`);
  }

  function formatDate(date) {
    return date.toISOString().slice(0, 10);
  }

  function formatDisplayDate(dateString) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(parseDate(dateString));
  }

  function normalizeDate(dateValue) {
    if (typeof dateValue !== "string" || !dateValue.trim()) {
      return null;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return Number.isNaN(parseDate(dateValue).getTime()) ? null : dateValue;
    }

    const parsedDate = new Date(dateValue);
    return Number.isNaN(parsedDate.getTime()) ? null : formatDate(parsedDate);
  }

  function addDays(dateString, numberOfDays) {
    const date = parseDate(dateString);
    date.setUTCDate(date.getUTCDate() + numberOfDays);
    return formatDate(date);
  }

  function getWeekDates(today) {
    const dayOfWeek = parseDate(today).getUTCDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = addDays(today, -daysSinceMonday);
    return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  }

  function getDateRange(startDate, endDate) {
    if (startDate > endDate) {
      return [];
    }

    const dates = [];
    let date = startDate;

    while (date <= endDate) {
      dates.push(date);
      date = addDays(date, 1);
    }

    return dates;
  }

  function isHabitCompletedOn(habitId, date, completions) {
    const completedHabitIds = completions[date];

    if (!Array.isArray(completedHabitIds)) {
      return false;
    }

    return completedHabitIds.some((completedId) => String(completedId) === String(habitId));
  }

  function getHabitStartDate(habit) {
    return normalizeDate(habit.startDate);
  }

  /**
   * Calculates completion over an inclusive reporting period. The effective
   * start is the later of the requested start date and habit.startDate, so
   * dates before habit creation never count as missed. Callers cap current
   * reporting periods at today.
   */
  function getCompletionStats(habit, startDate, endDate, completions) {
    const habitStartDate = getHabitStartDate(habit);
    const effectiveStart = habitStartDate && habitStartDate > startDate
      ? habitStartDate
      : startDate;
    const applicableDates = getDateRange(effectiveStart, endDate);
    const completed = applicableDates.filter((date) => {
      return isHabitCompletedOn(habit.id, date, completions);
    }).length;

    return {
      completed,
      total: applicableDates.length,
      percentage: applicableDates.length === 0
        ? 0
        : Math.round((completed / applicableDates.length) * 100),
    };
  }

  /**
   * Calculates streaks on or after the habit's start date. A streak ending
   * yesterday remains current until the user has a chance to check in today.
   */
  function getStreakStats(habit, today, completions) {
    const habitStartDate = getHabitStartDate(habit);
    const completedDates = Object.keys(completions)
      .filter((date) => {
        return normalizeDate(date) === date &&
          date <= today &&
          (!habitStartDate || date >= habitStartDate) &&
          isHabitCompletedOn(habit.id, date, completions);
      })
      .sort();

    let longest = 0;
    let runLength = 0;
    let previousDate = null;

    completedDates.forEach((date) => {
      if (previousDate && date === addDays(previousDate, 1)) {
        runLength += 1;
      } else {
        runLength = 1;
      }

      longest = Math.max(longest, runLength);
      previousDate = date;
    });

    let current = 0;
    let cursor = today;

    if (!isHabitCompletedOn(habit.id, cursor, completions)) {
      cursor = addDays(cursor, -1);
    }

    while (
      (!habitStartDate || cursor >= habitStartDate) &&
      isHabitCompletedOn(habit.id, cursor, completions)
    ) {
      current += 1;
      cursor = addDays(cursor, -1);
    }

    return { current, longest };
  }

  function pluralizeDays(numberOfDays) {
    return `${numberOfDays} ${numberOfDays === 1 ? "day" : "days"}`;
  }

  function showMessage(message, showAddHabitLink = false) {
    progressMessage.replaceChildren(document.createTextNode(message));

    if (showAddHabitLink) {
      const link = document.createElement("a");
      link.href = "add_habit.html";
      link.textContent = "Add your first habit";
      progressMessage.append(" ", link, ".");
    }

    progressMessage.hidden = false;
    contentSections.forEach((section) => {
      section.hidden = true;
    });
  }

  function showProgressContent() {
    progressMessage.hidden = true;
    progressMessage.replaceChildren();
    contentSections.forEach((section) => {
      section.hidden = false;
    });
  }

  function renderOverview(metrics, isCurrentWeek) {
    const weeklyCompleted = metrics.reduce((sum, metric) => {
      return sum + metric.week.completed;
    }, 0);
    const weeklyTotal = metrics.reduce((sum, metric) => sum + metric.week.total, 0);
    const monthlyCompleted = metrics.reduce((sum, metric) => {
      return sum + metric.month.completed;
    }, 0);
    const monthlyTotal = metrics.reduce((sum, metric) => sum + metric.month.total, 0);
    const streakLeader = metrics.reduce((leader, metric) => {
      return metric.streak.current > leader.streak.current ? metric : leader;
    });

    weeklyCompletion.textContent = `${weeklyCompleted} / ${weeklyTotal}`;
    weeklyCompletionDetail.textContent = isCurrentWeek
      ? "Check-ins completed so far this week"
      : "Check-ins completed in the selected week";
    monthlyAverage.textContent = monthlyTotal === 0
      ? "0%"
      : `${Math.round((monthlyCompleted / monthlyTotal) * 100)}%`;
    bestCurrentStreak.textContent = pluralizeDays(streakLeader.streak.current);
    bestCurrentStreakDetail.textContent = streakLeader.streak.current === 0
      ? "No active streak yet"
      : `${streakLeader.habit.name} is leading`;
  }

  function renderWeekNavigation(weekDates, currentWeekStart, earliestWeekStart) {
    weekRange.textContent = `${formatDisplayDate(weekDates[0])} – ` +
      formatDisplayDate(weekDates[6]);
    previousWeekButton.disabled = selectedWeekStart <= earliestWeekStart;
    nextWeekButton.disabled = selectedWeekStart >= currentWeekStart;
    currentWeekButton.disabled = selectedWeekStart === currentWeekStart;
  }

  function renderWeeklyTable(metrics, weekDates, today, focusHabitId, focusDate) {
    weeklyProgressBody.replaceChildren();

    weekdayHeaders.forEach((header, index) => {
      const dateNumber = parseDate(weekDates[index]).getUTCDate();
      header.textContent = `${DAY_LABELS[index]} ${dateNumber}`;
    });

    metrics.forEach((metric) => {
      const row = document.createElement("tr");
      const habitName = document.createElement("th");
      const habitStartDate = getHabitStartDate(metric.habit);

      habitName.scope = "row";
      habitName.textContent = metric.habit.name;
      row.appendChild(habitName);

      weekDates.forEach((date) => {
        const cell = document.createElement("td");
        const isUnavailable = date > today || (habitStartDate && date < habitStartDate);
        const isCompleted = isHabitCompletedOn(metric.habit.id, date, metric.completions);

        if (isUnavailable) {
          cell.textContent = "—";
          cell.className = "completion-unavailable";
          cell.setAttribute("aria-label", `${formatDisplayDate(date)}: not available`);
        } else {
          const toggle = document.createElement("button");
          const action = isCompleted ? "Remove" : "Add";

          toggle.type = "button";
          toggle.className = "completion-toggle";
          toggle.textContent = isCompleted ? "✓" : "—";
          toggle.dataset.habitId = String(metric.habit.id);
          toggle.dataset.date = date;
          toggle.setAttribute("aria-pressed", String(isCompleted));
          toggle.setAttribute(
            "aria-label",
            `${action} ${metric.habit.name} check-in for ${formatDisplayDate(date)}`,
          );
          toggle.addEventListener("click", () => {
            try {
              setHabitCompletion(metric.habit.id, date, !isCompleted);
            } catch {
              progressMessage.textContent = "HabitFlow could not save that check-in. Try again.";
              progressMessage.hidden = false;
              return;
            }

            render(metric.habit.id, date);
          });
          cell.appendChild(toggle);
        }

        row.appendChild(cell);
      });

      const total = document.createElement("td");
      total.textContent = `${metric.week.completed} / ${metric.week.total}`;
      row.appendChild(total);
      weeklyProgressBody.appendChild(row);
    });

    if (focusHabitId !== null && focusDate) {
      const focusTarget = Array.from(
        weeklyProgressBody.querySelectorAll(".completion-toggle"),
      ).find((toggle) => {
        return toggle.dataset.habitId === String(focusHabitId) &&
          toggle.dataset.date === focusDate;
      });
      focusTarget?.focus();
    }
  }

  function animateProgressBar(progressBar, targetValue) {
    if (reduceMotion || targetValue === 0) {
      progressBar.value = targetValue;
      return;
    }

    const duration = 700;
    let startTime;

    function updateProgress(currentTime) {
      if (startTime === undefined) {
        startTime = currentTime;
      }

      const elapsed = currentTime - startTime;
      const animationProgress = Math.min(elapsed / duration, 1);
      progressBar.value = Math.round(targetValue * animationProgress);

      if (animationProgress < 1) {
        window.requestAnimationFrame(updateProgress);
      }
    }

    window.requestAnimationFrame(updateProgress);
  }

  function renderMonthlyProgress(metrics) {
    monthlyProgressList.replaceChildren();

    metrics.forEach((metric, index) => {
      const figure = document.createElement("figure");
      const caption = document.createElement("figcaption");
      const progressBar = document.createElement("progress");
      const labelId = `monthly-progress-label-${index}`;

      figure.className = "habit-progress";
      caption.id = labelId;
      caption.textContent = `${metric.habit.name} — ${metric.month.completed} of ` +
        `${metric.month.total} days (${metric.month.percentage}%)`;

      progressBar.max = metric.month.total || 1;
      progressBar.value = 0;
      progressBar.textContent = `${metric.month.completed} / ${metric.month.total}`;
      progressBar.setAttribute("aria-labelledby", labelId);
      progressBar.setAttribute(
        "aria-valuetext",
        `${metric.month.completed} of ${metric.month.total} days, ` +
          `${metric.month.percentage}% complete`,
      );

      figure.append(caption, progressBar);
      monthlyProgressList.appendChild(figure);
      animateProgressBar(progressBar, metric.month.completed);
    });
  }

  function renderStreakTable(metrics) {
    streakProgressBody.replaceChildren();

    metrics.forEach((metric) => {
      const row = document.createElement("tr");
      const habitName = document.createElement("th");
      const currentStreak = document.createElement("td");
      const longestStreak = document.createElement("td");

      habitName.scope = "row";
      habitName.textContent = metric.habit.name;
      currentStreak.textContent = pluralizeDays(metric.streak.current);
      longestStreak.textContent = pluralizeDays(metric.streak.longest);
      row.append(habitName, currentStreak, longestStreak);
      streakProgressBody.appendChild(row);
    });
  }

  function render(focusHabitId = null, focusDate = null) {
    if (
      typeof loadHabits !== "function" ||
      typeof loadCompletions !== "function" ||
      typeof setHabitCompletion !== "function"
    ) {
      showMessage("Progress tracking is unavailable because the shared habit data did not load.");
      return;
    }

    let habits;
    let completions;

    try {
      habits = loadHabits();
      completions = loadCompletions();
    } catch {
      showMessage("HabitFlow could not read your saved progress. Please reload and try again.");
      return;
    }

    if (!Array.isArray(habits) || !completions || typeof completions !== "object") {
      showMessage("HabitFlow could not read your saved progress. Please reload and try again.");
      return;
    }

    const trackableHabits = habits.filter((habit) => {
      return habit && habit.id !== undefined && habit.id !== null && habit.name;
    });

    if (trackableHabits.length === 0) {
      selectedWeekStart = null;
      showMessage("You do not have any habits to track yet.", true);
      return;
    }

    const sharedToday = typeof getTodayDate === "function" ? getTodayDate() : "";
    const today = normalizeDate(sharedToday) || formatDate(new Date());
    const currentWeekDates = getWeekDates(today);
    const currentWeekStart = currentWeekDates[0];
    const habitStartDates = trackableHabits
      .map((habit) => getHabitStartDate(habit))
      .filter(Boolean);
    const completionDates = Object.keys(completions).filter((date) => {
      return normalizeDate(date) === date && trackableHabits.some((habit) => {
        return isHabitCompletedOn(habit.id, date, completions);
      });
    });
    const earliestTrackedDate = [...habitStartDates, ...completionDates].sort()[0] || today;
    const earliestWeekStart = getWeekDates(earliestTrackedDate)[0];

    if (!selectedWeekStart || selectedWeekStart > currentWeekStart) {
      selectedWeekStart = currentWeekStart;
    } else if (selectedWeekStart < earliestWeekStart) {
      selectedWeekStart = earliestWeekStart;
    }

    const weekDates = getWeekDates(selectedWeekStart);
    const weekEnd = weekDates[6];
    const statsEnd = weekEnd < today ? weekEnd : today;
    const monthStart = addDays(today, -29);
    const metrics = trackableHabits.map((habit) => {
      return {
        habit,
        completions,
        week: getCompletionStats(habit, selectedWeekStart, statsEnd, completions),
        month: getCompletionStats(habit, monthStart, today, completions),
        streak: getStreakStats(habit, today, completions),
      };
    });
    const isCurrentWeek = selectedWeekStart === currentWeekStart;

    showProgressContent();
    renderOverview(metrics, isCurrentWeek);
    renderWeekNavigation(weekDates, currentWeekStart, earliestWeekStart);
    renderWeeklyTable(metrics, weekDates, today, focusHabitId, focusDate);
    renderMonthlyProgress(metrics);
    renderStreakTable(metrics);
  }

  previousWeekButton.addEventListener("click", () => {
    selectedWeekStart = addDays(selectedWeekStart, -7);
    render();
  });

  currentWeekButton.addEventListener("click", () => {
    selectedWeekStart = null;
    render();
  });

  nextWeekButton.addEventListener("click", () => {
    selectedWeekStart = addDays(selectedWeekStart, 7);
    render();
  });

  window.addEventListener("storage", (event) => {
    if (event.key === "habitflow_habits" || event.key === "habitflow_completions") {
      render();
    }
  });

  render();
})();
