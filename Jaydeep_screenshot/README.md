# Screenshot Guide – Jaydeep Mallick

**Team Member:** Jaydeep Mallick  
**Roll Number:** 252U1R9047  
**Assigned Responsibility:** REST Endpoints for builders, robots, and loans, including the JOIN endpoint

---

## Assigned Responsibilities
Jaydeep is responsible for implementing the REST API endpoints across all three resources:
- Robot CRUD operations (`GET`, `POST`, `PUT`, `DELETE` for `/robots`).
- Builder operations (`GET`, `POST`, `GET /:id` for `/builders`).
- Loan operations (`GET`, `POST`, `GET /:id`, return flow for `/loans`).
- The mandatory SQL `JOIN` endpoint (`GET /loans/details`) displaying builder name, robot name, and robot code.

---

## Screenshot Checklist

Capture the following execution screenshots in Postman or terminal and save them directly inside `Jaydeep_screenshot/`:

| Filename | Endpoint & Action | Description / Expected Result |
| :--- | :--- | :--- |
| `01_Get_All_Robots.png` | `GET /robots` | HTTP 200 OK returning array of robots. |
| `02_Get_Robot_By_ID.png` | `GET /robots/:id` | HTTP 200 OK returning single robot object. |
| `03_Add_Robot.png` | `POST /robots` | HTTP 201 Created returning newly created robot with auto-generated code. |
| `04_Update_Robot.png` | `PUT /robots/:id` | HTTP 200 OK returning updated robot name and kind. |
| `05_Delete_Robot.png` | `DELETE /robots/:id` | HTTP 204 No Content for unloaned robot. |
| `06_Get_All_Builders.png` | `GET /builders` | HTTP 200 OK returning array of registered builders. |
| `07_Get_Builder_By_ID.png` | `GET /builders/:id` | HTTP 200 OK returning single builder record. |
| `08_Get_All_Loans.png` | `GET /loans` | HTTP 200 OK returning list of all loan contracts. |
| `09_Create_Loan.png` | `POST /loans` | HTTP 201 Created creating an active loan (`return_date: null`). |
| `10_Get_Loan_By_ID.png` | `GET /loans/:id` | HTTP 200 OK returning single loan record. |
| `11_Loan_Details_JOIN.png` | `GET /loans/details` | HTTP 200 OK displaying joined fields: `builder_name`, `robot_name`, `robot_code`. |

---

## Instructions for Submission
1. Start the server using `npm start`.
2. Execute each request in Postman or browser.
3. Save clear screenshots with the exact filenames listed above.
4. Commit captured images to version control.

