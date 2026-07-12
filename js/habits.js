document.addEventListener("DOMContentLoaded", () => {
  const listSection = document.getElementById("habits-list");
  const noMatchSection = document.getElementById("habits-none-match");
  const emptySection = document.getElementById("habits-empty");
  const filterForm = document.getElementById("filter-form");
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");

  if (!listSection) {
    return;
  }

  const FREQUENCY_LABELS = {
    Daily: "Daily",
    TwiceWeekly: "Twice Weekly",
    ThriceWeekly: "Thrice Weekly",
    Weekly: "Weekly",
  };

  
  const PRIORITY_CLASSES = {
    Low: "priority-low",
    Medium: "priority-medium",
    High: "priority-high",
  };
  
  function render() {
    const allHabits = loadHabits();

    
    if (allHabits.length === 0) {
      listSection.hidden = true;
      noMatchSection.hidden = true;
      emptySection.hidden = false;
      return;
    }
    emptySection.hidden = true;

    
    const searchText = (searchInput?.value || "").trim().toLowerCase();
    const selectedCategory = categoryFilter?.value || "all";

    const visibleHabits = allHabits.filter((habit) => {
      const matchesSearch =
        searchText === "" || habit.name.toLowerCase().includes(searchText);
      const matchesCategory =
        selectedCategory === "all" || habit.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    
    if (visibleHabits.length === 0) {
      listSection.hidden = true;
      noMatchSection.hidden = false;
      return;
    }
    noMatchSection.hidden = true;
    listSection.hidden = false;

    
    listSection.querySelectorAll("article").forEach((article) => article.remove());

    const today = getTodayDate();
    visibleHabits.forEach((habit) => {
      listSection.appendChild(buildHabitCard(habit, today));
    });
  }

  /**
   * Builds a single habit card (<article>) element for one habit.
   * @param {Habit} habit - The habit to render.
   * @param {string} today - Today's date (YYYY-MM-DD), used by the toggle.
   * @returns {HTMLElement}
   */
  function buildHabitCard(habit, today) {
    const article = document.createElement("article");
    article.className = PRIORITY_CLASSES[habit.priority] || "priority-medium";

    // Habit name.
    const title = document.createElement("h3");
    title.textContent = habit.name;
    article.appendChild(title);

    
    const categoryLine = document.createElement("p");
    const categoryLabel = document.createElement("strong");
    categoryLabel.textContent = "Category: ";
    const categoryPill = document.createElement("span");
    categoryPill.className = "category";
    categoryPill.textContent = habit.category || "Other";
    categoryLine.append(categoryLabel, categoryPill);
    article.appendChild(categoryLine);

    
    if (habit.description) {
      const desc = document.createElement("p");
      desc.textContent = habit.description;
      article.appendChild(desc);
    }

    
    const meta = document.createElement("p");
    const freqLabel = document.createElement("strong");
    freqLabel.textContent = "Frequency: ";
    const priorityLabel = document.createElement("strong");
    priorityLabel.textContent = "Priority: ";
    meta.append(
      freqLabel,
      FREQUENCY_LABELS[habit.frequency] || habit.frequency || "Daily",
      " | ",
      priorityLabel,
      habit.priority || "Medium"
    );
    article.appendChild(meta);
    
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "done-toggle";

    
    function paintToggle(done) {
      toggle.textContent = done ? "✓ Completed" : "Complete?";
      toggle.setAttribute("aria-pressed", String(done));
      toggle.classList.toggle("is-done", done);
    }

    paintToggle(isHabitCompleted(habit.id, today));

    toggle.addEventListener("click", () => {
      const nowDone = !isHabitCompleted(habit.id, today);
      setHabitCompletion(habit.id, today, nowDone);
      paintToggle(nowDone);
    });

    article.appendChild(toggle);
    return article;
  }

  
  searchInput?.addEventListener("input", render);
  categoryFilter?.addEventListener("change", render);

  
  filterForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });

  
  render();
});
