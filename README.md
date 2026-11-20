# AZ-900 Practice Portal

A lightweight, responsive AZ-900 practice website built with **HTML, CSS, and vanilla JavaScript**. There is no build step, Node.js backend, database, login, or external quiz framework.

## Included in this starter project

- Four learning phases and all 40 episodes from the supplied navigation/topic list.
- Episode-wise question-bank structure in JSON.
- 21 illustrative sample questions across the phases.
- Single-choice, multiple-select, True/False, and matching question formats.
- Immediate question feedback after the learner selects **Check answer**.
- Correct-answer explanations, final score, answer review, and retry.
- A mixed starter mock test using all questions currently in the sample bank.
- Browser-local practice history using `localStorage`.
- Responsive layout for laptop, tablet, and mobile.
- Azure Static Web Apps configuration file.

> **Content note:** The current questions are sample questions to demonstrate the experience. Adam's full question bank has not been imported. Topics without sample questions are still visible in the catalogue and are marked **Question bank pending**.

## Project structure

```text
az900-practice-portal/
├── index.html
├── staticwebapp.config.json
├── README.md
├── css/
│   └── style.css
├── js/
│   └── app.js
└── data/
    ├── catalog.json
    └── questions.json
```

## Run locally

Do not open `index.html` by double-clicking it. The browser may block `fetch()` requests to the JSON files when the page is opened with a `file://` URL. Run a small local web server instead.

### Option 1: VS Code Live Server

1. Extract the ZIP and open the `az900-practice-portal` folder in VS Code.
2. Install the **Live Server** extension if it is not already installed.
3. Right-click `index.html` and choose **Open with Live Server**.
4. The site opens in your browser. Changes to the files can be refreshed in the browser.

### Option 2: Python

Open a terminal in the project folder and run:

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

If `python` is not recognized on Windows, try `py -m http.server 5500`.

## Add or update questions

All question content is kept in `data/questions.json`. To add a question, append one object to the `questions` array.

### Single-choice question

```json
{
  "id": "q-e09-02",
  "episodeId": "ep-09",
  "type": "single",
  "question": "Which Azure service is used for this scenario?",
  "instruction": "Choose one answer.",
  "options": [
    { "id": "A", "text": "Option A", "feedback": "Why this option is right or wrong." },
    { "id": "B", "text": "Option B", "feedback": "Why this option is right or wrong." },
    { "id": "C", "text": "Option C", "feedback": "Why this option is right or wrong." },
    { "id": "D", "text": "Option D", "feedback": "Why this option is right or wrong." }
  ],
  "correctAnswers": ["B"],
  "explanation": "A short explanation shown after checking the answer.",
  "difficulty": "Easy"
}
```

### Multiple-select question

Use `"type": "multiple"` and include every correct option ID in `correctAnswers`, for example `"correctAnswers": ["A", "C"]`. The learner must select the complete correct set to receive a point.

### Matching question

Use `"type": "matching"`, define a `matches` array with each item's `id`, `label`, and possible `options`, then provide a `correctMatches` object mapping each item ID to its correct option text. Each match must be selected for the question to be checked.

```json
{
  "id": "q-e10-match-01",
  "episodeId": "ep-10",
  "type": "matching",
  "question": "Match each networking component with its role.",
  "matches": [
    { "id": "vnet", "label": "Virtual Network", "options": ["Isolated network environment", "Traffic distribution"] },
    { "id": "lb", "label": "Load Balancer", "options": ["Isolated network environment", "Traffic distribution"] }
  ],
  "correctMatches": { "vnet": "Isolated network environment", "lb": "Traffic distribution" },
  "explanation": "A VNet provides network isolation; a Load Balancer distributes traffic."
}
```

### True/False question

Use `"type": "truefalse"` with two options whose IDs are exactly `true` and `false`, and set `correctAnswers` to either `["true"]` or `["false"]`.

### Important fields

- `id`: Unique question ID.
- `episodeId`: Must match an episode ID in `data/catalog.json` (for example, `ep-10`).
- `type`: `single`, `multiple`, or `truefalse`.
- `options`: The available answer options. Each option needs an `id`, `text`, and `feedback`.
- `correctAnswers`: Array of the correct option IDs.
- `explanation`: Explanation displayed after checking the answer and in the review.

Keep the JSON valid: use double quotes, commas between objects, and no trailing comma after the final item. Refresh the site after saving the file.

## Add a diagram or image to a question later

Place the image in `assets/images/`, then add an `image` path and an `imageAlt` description to that question object. The current renderer will display it above the answer controls. Example: `"image": "assets/images/scaling-diagram.png"`.

## Azure Static Web Apps deployment

This project is a static site and does not need an API. The simplest deployment path is GitHub integration with Azure Static Web Apps.

1. Create a new GitHub repository (for example, `az900-practice-portal`).
2. Extract this project and upload the **contents** of the `az900-practice-portal` folder to the repository root. Ensure `index.html`, `css/`, `js/`, and `data/` are at the root level.
3. In the Azure portal, choose **Create a resource** and search for **Static Web Apps**.
4. Select your subscription and resource group, enter an app name, choose a plan, and select **GitHub** as the deployment source. Authorize GitHub and select the repository and branch (normally `main`).
5. For the build details, select **Custom** (or **No Framework**, depending on the portal wording). Use:

   | Setting | Value |
   |---|---|
   | App location | `/` |
   | API location | Leave empty |
   | Output location | Leave empty |

6. Review and create the Static Web App. Azure creates a GitHub Actions workflow in the repository.
7. Open the repository's **Actions** tab and wait for the deployment workflow to finish successfully.
8. Open the Static Web App resource in Azure and visit its generated URL.

Future commits pushed to the connected branch trigger deployments. The `staticwebapp.config.json` file is included in the project for static-site routing and JSON MIME handling.

Official Microsoft guidance:
- [Create a Static Web App in the Azure portal](https://learn.microsoft.com/en-us/azure/static-web-apps/get-started-portal)
- [Azure Static Web Apps build configuration](https://learn.microsoft.com/en-us/azure/static-web-apps/build-configuration)

## Current limitations (intentional for this first version)

- No student sign-in or identity verification.
- No teacher/admin dashboard.
- Scores are saved only in the learner's current browser and are not visible to the instructor.
- Since questions and correct answers are delivered to the browser, a learner with technical knowledge can inspect the answer key. Do not use this version for a high-stakes or secure exam.
- The mock test is a mixed practice set made from the sample bank, not a full official AZ-900 exam simulation.
- Questions can optionally include a diagram image using an `image` path and an `imageAlt` description. Place those files in `assets/images/`.

A future version with a backend can provide student login, centrally stored results, teacher reports, timed exams, and secure answer validation. For the immediate practice requirement, this static version keeps hosting and maintenance simple.
