// Page logic for add_habit.html 
// uses the shared globals defined in js/script.js (Habit, loadHabits,
// saveHabits, getTodayDate, and the SAVED_CHANGES_* message constants)

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("add-habit-form");
  const message = document.getElementById("form-message");

  // Guard: this script is only meant for the Add Habit page.
  if (!form) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = form.habitName.value.trim();
    // The `required` attribute normally blocks empty names, but guard anyway.
    if (!name) {
      return;
    }

    const habits = loadHabits();

    // sequential id: one higher than the largest existing id, so ids keep
    // counting up and stay unique even if a habit is later deleted.
    const nextId = habits.reduce((max, habit) => Math.max(max, habit.id ?? 0), 0) + 1;

    const habit = new Habit({
      id: nextId,
      name,
      category: form.category.value,
      description: form.description.value.trim(),
      frequency: form.frequency.value,
      priority: form.priority.value,
      startDate: getTodayDate(),
    });

    habits.push(habit);

    try {
      saveHabits(habits);
    } catch (error) {
      // localStorage can throw so we catch it
      console.error("Failed to save habit:", error);
      showMessage(SAVED_CHANGES_ERROR_MESSAGE);
      return;
    }

    showMessage(SAVED_CHANGES_MESSAGE);
    form.reset();
  });

  /**
   * Shows a status message below the form.
   * @param {string} text
   */
  function showMessage(text) {
    if (!message) {
      return;
    }
    message.textContent = text;
    message.hidden = false;
  }
});
