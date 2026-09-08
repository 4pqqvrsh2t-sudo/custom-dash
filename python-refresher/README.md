# PyRecall

PyRecall is a small, dependency-free Python memory trainer built for short daily refresh sessions.

## How it works

- **Daily refresh:** 5 questions selected from concepts marked as learned.
- **Spaced repetition:** missed concepts are due again immediately; successful recall increases the interval before the next review.
- **Adaptive difficulty:** questions progress from recognition (`Recall`) to editing/prediction (`Apply`) and then writing/manipulating code (`Manipulate`).
- **Challenge mode:** after the daily session, extra practice intentionally raises the difficulty. The UI frames this as “Eager to remember?”
- **Haven't learned it:** removes that concept from the active pool and replaces the current question with a harder question from something already learned.
- **Concept controls:** the learner can enable new topics as their main course reaches them.
- **Local progress:** mastery, XP, streak, learned concepts, review intervals, and reminder settings are stored in `localStorage` on the device.
- **Installable/offline:** includes a web app manifest and service worker.

## Included concepts

The starter set covers `print()`, variables, strings, numbers, `input()`, booleans, comparisons, and `if/elif/else`. Lists, loops, functions, and dictionaries ship disabled so the trainer does not jump ahead of a beginner course.

## Reminder limitation

The app can request browser notification permission and check the chosen reminder time while it is running. Static web apps cannot guarantee scheduled background notifications on every device, especially when iOS suspends the PWA. Guaranteed closed-app push reminders would require a push subscription plus a server or scheduled backend job.

## Run

Open `index.html` through a web server or host the folder with GitHub Pages. Service workers and installability require HTTPS (or localhost).
