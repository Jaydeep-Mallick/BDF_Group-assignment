# Screenshot Guide – Rithwik Reddy

**Team Member:** Rithwik Reddy  
**Roll Number:** 252U1R9059  
**Assigned Responsibility:** Validation and search

---

## Assigned Responsibilities
Rithwik is responsible for input validation across add and update operations, parameter sanitization (positive integer IDs, trimming strings, rejecting whitespace-only values), clear error messages, and case-insensitive query parameter-based search.

---

## Screenshot Checklist

Capture the following execution screenshots and place them inside `Rithwik_screenshot/`:

| Filename | Endpoint & Action | Description / Expected Result |
| :--- | :--- | :--- |
| `01_Missing_Robot_Name.png` | `POST /robots` with missing name | HTTP 400 Bad Request: `{"error": "Robot name is required"}`. |
| `02_Missing_Robot_Kind.png` | `POST /robots` with missing kind | HTTP 400 Bad Request: `{"error": "Robot kind is required"}`. |
| `03_Invalid_Robot_ID.png` | `GET /robots/invalid_id` | HTTP 400 Bad Request: `{"error": "Invalid robot id format"}`. |
| `04_Search_By_Kind.png` | `GET /robots?kind=Humanoid` | HTTP 200 OK returning only robots matching kind `Humanoid`. |
| `05_Search_By_Name.png` | `GET /robots?name=Robo` | HTTP 200 OK returning robots with name containing substring `Robo`. |
| `06_Validation_Error_Messages.png` | Postman validation test run | Summary view showing meaningful error messages across 400 responses. |

---

## Instructions for Submission
1. Test each validation rule and query parameter filter in Postman.
2. Save clear screenshots matching the filenames above.
3. Commit all captured images to `Rithwik_screenshot/`.

