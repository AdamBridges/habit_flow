// SHARED CONSTANTS //
// The following constants are used throughout the application for localStorage keys and user messages. Additional constants can be added here as needed for future features or messages.

/**
 * This key is used to store and retrieve the habits array from localStorage.
 */
const HABITS_KEY = "habitflow_habits";

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
  console.log("Habits saved to localStorage:", habits);
}

/**
 * Loads the habits array from localStorage, returns empty array if none saved.
 * @returns {Habit[]} - An array of Habit objects loaded from localStorage.
 */
function loadHabits() {
  const stored = localStorage.getItem(HABITS_KEY);
  console.log("Habits loaded from localStorage:", stored);
  if (stored) {
    return JSON.parse(stored).map(
        habit => new Habit(habit.name, habit.frequency, habit.startDate)
    );
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


// SHARED CLASSES //
// The following classes are used throughout the application to represent and manage habit objects. Additional classes can be added here as needed for future features or functionality.

/**
 * Represents a habit with a name, frequency, and start date.
 * Use this class to create and manage habit objects that are saved/retrieved from localStorage.
 */
class Habit {

/**
 * The name of the habit.
 * @type {string}
 */
name;

/**
 * The frequency of the habit.
 * @type {number}
 */
frequency;

/**
 * The start date of the habit.
 * @type {string}
 */
startDate;

/**
 * Creates a new Habit instance.
 * @param {string} name 
 * @param {number} frequency 
 * @param {string} startDate 
 */
  constructor(name, frequency, startDate) {
    this.name = name;
    this.frequency = frequency;
    this.startDate = startDate;
  }

}