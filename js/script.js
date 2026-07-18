// SHARED CONSTANTS //
// The following constants are used throughout the application for localStorage keys and user messages. Additional constants can be added here as needed for future features or messages.

/**
 * This key is used to store and retrieve the habits array from localStorage.
 */
const HABITS_KEY = "habitflow_habits";

const COMPLETIONS_KEY = "habitflow_completions";

const SAVED_CHANGES_MESSAGE = "Your changes have been saved!";
const SAVED_CHANGES_ERROR_MESSAGE = "Sorry, there was an error saving your changes. Please try again later.";

const EMAIL_ERROR_MESSAGE = "Please enter a valid email address.";
const EMAIL_SUCCESS_MESSAGE = "Thank you for contacting us!";
const EMAIL_FAILURE_MESSAGE = "Sorry, there was an error sending your message. Please try again later.";


// SHARED FUNCTIONS //
// The following functions are utility functions used throughout the application for date handling, localStorage management, and email validation. Additional shared functions can be added here as needed for future features or functionality.

/**
 * Returns today's date as a string: "2026-06-30".
 * @returns {string} - Today's date in YYYY-MM-DD format.
 */
function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Saves the habits array to localStorage.
 * @param {Habit[]} habits - The array of Habit objects to save.
 */
function saveHabits(habits) {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}

/**
 * Loads the habits array from localStorage, returns empty array if none saved.
 * @returns {Habit[]} - An array of Habit objects loaded from localStorage.
 */
function loadHabits() {
  const stored = localStorage.getItem(HABITS_KEY);
  if (stored) {
    return JSON.parse(stored).map(habit => new Habit(habit));
  }
  return [];
}

/**
 * Validates an email address format using Regular Expression. Returns true or false.
 * @param {string} email - The email address to validate.
 * @returns {boolean} - True if the email is valid, false otherwise.
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


/**
 * Loads the completions object from localStorage. Returns an empty object if
 * nothing has been saved yet.
 *
 * The returned object maps a date string ("2026-07-11") to an array of habit
 * ids completed on that date, e.g. { "2026-07-11": [1, 3] }.
 *
 * @returns {Object<string, number[]>}
 */
function loadCompletions() {
  const stored = localStorage.getItem(COMPLETIONS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return {};
}

/**
 * Saves the completions object to localStorage.
 * @param {Object<string, number[]>} completions
 */
function saveCompletions(completions) {
  localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
}

/**
 * Checks whether a specific habit was completed on a specific date.
 * @param {number} habitId - The id of the habit to check.
 * @param {string} date - The date to check, in YYYY-MM-DD format.
 * @returns {boolean} - True if that habit is marked complete on that date.
 */
function isHabitCompleted(habitId, date) {
  const completions = loadCompletions();
  const idsForDay = completions[date] || [];
  return idsForDay.includes(habitId);
}

/**
 * Marks a habit as either complete or not complete on a given date, then saves
 * the change to localStorage. This is the single place that both the dashboard
 * checklist and the My Habits "Done today" toggle go through, so completion
 * data always stays consistent no matter which page you use.
 *
 * @param {number} habitId - The id of the habit being toggled.
 * @param {string} date - The date being changed, in YYYY-MM-DD format.
 * @param {boolean} done - True to mark complete, false to unmark.
 */
function setHabitCompletion(habitId, date, done) {
  const completions = loadCompletions();

  // Start from the list of ids already completed that day (or an empty list).
  const idsForDay = completions[date] || [];

  // Rebuild the list: keep every id EXCEPT the one we're changing. This gives
  // us a clean list with no duplicates, which we then add the id back into
  // only if `done` is true.
  const withoutThisHabit = idsForDay.filter((id) => id !== habitId);

  if (done) {
    withoutThisHabit.push(habitId);
  }

  if (withoutThisHabit.length > 0) {
    completions[date] = withoutThisHabit;
  } else {
    // No habits left for this day, so drop the empty entry to keep the object tidy.
    delete completions[date];
  }

  saveCompletions(completions);
}


// SHARED CLASSES //
// The following classes are used throughout the application to represent and manage habit objects. Additional classes can be added here as needed for future features or functionality.

/**
 * Represents a habit the user is tracking.
 * Use this class to create and manage habit objects that are saved/retrieved from localStorage.
 */
class Habit {

  /**
   * Unique, sequential identifier for the habit.
   * @type {number}
   */
  id;

  /**
   * The name of the habit.
   * @type {string}
   */
  name;

  /**
   * The category of the habit (e.g. "Health", "Productivity", "Learning", "Other").
   * @type {string}
   */
  category;

  /**
   * A free-text description of the habit. May be an empty string.
   * @type {string}
   */
  description;

  /**
   * How often the habit should be done ("Daily", "TwiceWeekly", "ThriceWeekly", "Weekly").
   * @type {string}
   */
  frequency;

  /**
   * The priority of the habit ("Low", "Medium", "High").
   * @type {string}
   */
  priority;

  /**
   * The start date of the habit in YYYY-MM-DD format.
   * @type {string}
   */
  startDate;

  /**
   * Creates a new Habit instance
   * @param {Object} habit
   * @param {number} habit.id
   * @param {string} habit.name
   * @param {string} habit.category
   * @param {string} habit.description
   * @param {string} habit.frequency
   * @param {string} habit.priority
   * @param {string} habit.startDate
   */
  constructor({ id, name, category, description, frequency, priority, startDate }) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.description = description;
    this.frequency = frequency;
    this.priority = priority;
    this.startDate = startDate;
  }

}