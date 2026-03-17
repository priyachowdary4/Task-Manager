# Task-Manager# 

A high-performance, responsive Task Management application built with **Vanilla JavaScript** and **Modern CSS**. This project demonstrates advanced state management, data validation, and user-centric design principles.

---

## ✨ Key Features

* **Priority-Based Filtering:** Real-time task sorting using a "clubbed" pastel filter system (All, Active, Completed).
* **Strict Date Validation:** Logic-gate implementation to block past-date scheduling, ensuring data integrity.
* **Soft Delete & Trash System:** Includes a "Trash" buffer with priority-specific confirmation prompts and mandatory deletion notes.
* **Bulk Operations:** Checkbox-based multi-delete functionality for efficient task management.
* **Persistence:** Fully integrated with the `LocalStorage API` to maintain state across browser sessions.
* **Data Portability:** Supports JSON import for seamless task migration.

## 🛠️ Tech Stack & Concepts

| Category | Technology |
| :--- | :--- |
| **Language** | JavaScript (ES6+), HTML5 |
| **Styling** | CSS3 (Flexbox, Custom Properties, Transitions) |
| **Storage** | LocalStorage API |
| **Icons** | Font Awesome |
| **Logic** | Event Delegation, Array Prototypes, DOM Manipulation |

---

## 🧠 Development Insights for HENNGE Internship

For this project, I focused on **Edge Case Management**—a core value in professional front-end development. 

1.  **Logical Constraints:** I implemented a `setMinDate` function that dynamically interacts with the DOM to disable past dates, preventing invalid data entry at the source.
2.  **State Synchronization:** The UI is built using a "Render-on-Change" pattern. Any modification to the task array triggers a re-render of the specific list segment, keeping the UI perfectly in sync with the underlying data.
3.  **Accessible UI:** Used semantic HTML and clear visual separation (Pastel Color Coding) to ensure the interface is intuitive and accessible.

---

## 📥 How to Run Locally
1. Clone the repository.
2. Open `index.html` in any modern web browser.
