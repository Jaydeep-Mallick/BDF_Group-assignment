# Screenshot Guide – G. Sudeshna

**Team Member:** G. Sudeshna  
**Roll Number:** 252U1R9039  
**Assigned Responsibility:** Twist rule – automatic robot codes

---

## Assigned Responsibilities
Sudeshna is responsible for the special twist:
- Automatic, sequential robot code generation (`ROB-0001`, `ROB-0002`...).
- Server-side generation ensuring clients cannot inject custom codes.
- Code immutability during updates (`PUT /robots/:id` cannot modify code).
- Concurrency-safe, database-backed counter ensuring deleted codes are not reused.
- Passing all three mandatory twist evaluation tests.

---

## Screenshot Checklist

Capture the following execution screenshots and place them inside `Sudeshna_screenshot/`:

| Filename | Action / Test | Description / Expected Result |
| :--- | :--- | :--- |
| `01_First_Robot_ROB0001.png` | `POST /robots` (Mandatory Test 1) | HTTP 201 Created showing first robot receiving code `ROB-0001`. |
| `02_Second_Robot_ROB0002.png` | `POST /robots` (Mandatory Test 2) | HTTP 201 Created showing second robot receiving code `ROB-0002`. |
| `03_Update_Code_Unchanged.png` | `PUT /robots/:id` (Mandatory Test 3) | HTTP 200 OK updating name/kind with payload containing `"code": "ROB-9999"`, but original code `ROB-0001` remains unchanged. |
| `04_Twist_Test_Results.png` | Terminal `node --test tests/twist.test.js` | Terminal view showing all mandatory twist tests passing with green checkmarks. |

---

## Instructions for Submission
1. Follow the twist lifecycle in Postman or execute the automated twist test suite.
2. Ensure status codes and generated codes match the specification.
3. Save each screenshot using the exact filenames listed above.
4. Commit captured images to `Sudeshna_screenshot/`.

