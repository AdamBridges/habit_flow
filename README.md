# Project HabitFlow

HabitFlow is a website that helps users build and maintain positive daily habits. Users can create personal habits, check them off each day, and monitor their consistency through streaks and completion statistics.

## Team Members

- Adam Bridges
- Tina Kaus
- Muskaan Sengupta
- Liam West

## Pages

- Home (index.html)
- Dashboard
- My Habits
    - Add Habit
- Progress 
- Tips & Resources
- About
- Contact

## Content Structure

Content is structured following standard HTML practices with `<html>`, `<head>`, and `<body>` elements parenting the child elements. The fundamental child elements nested within include `<meta>`, `<title>`, `<link>`, `<script>`, `<header>`, `<nav>`, `<main>`, and `<footer>` elements that extend across every page. These elements support the structure of each page and ensure consistency across the website.

## Styling and Responsive Design

The team set out to build a theme for selectors within `style.css` as an initial template for general use across page styling. The team iteratively improved `style.css` as needed and implemented responsiveness via the use of `@media` queries within `style.css`. Additionally, the team implemented classes and identifiers to handle the nuances of some pages, such as the use of `div` with a grid layout instead of a `table`. 

## JavaScript Functionality

The JavaScript functions were designed to be called after the DOM of a page finishes loading using the `defer` attribute. Subsequent fundamental functions include storing and retrieving a user's habits via `localStorage` and a `Habits` class to help keep data organised. Functionality extends to include organising the metrics of habits into dashboards to reflect activity and performance which include weekly/monthly progress, streaks, trends, and history.

## GitHub Pages URL

[https://adambridges.github.io/habit_flow/](https://adambridges.github.io/habit_flow/)


## Credits/References

Only assets provided were the display picture of each team member. 

References for the `tips.html` include the following: 

- [Plan to Organize: Habit Tracking](https://plantoorganize.com/habit-tracking/?v=aee816c341a8)
- [James Clear: The Habits Guide](https://jamesclear.com/habits)
- [The Science Behind Habit Tracking](https://www.psychologytoday.com/us/blog/parenting-from-a-neuroscience-perspective/202512/the-science-behind-habit-tracking)

Other references include: 

- [Zybooks - LE/DIGT 1302: Web Development Basics](https://learn.zybooks.com/zybook/YORKULE-DIGT1302HaidarSummer2026)
