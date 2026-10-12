const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const usersFile = path.join(__dirname, "data", "users.json");

// =====================================
// YOUR NEW ADMIN LOGIN DETAILS
// =====================================

const adminEmail = "admin@gmail.com";
const adminPassword = "Admin12345";

// =====================================
// READ USERS
// =====================================

let users = [];

if (fs.existsSync(usersFile)) {
    const file = fs.readFileSync(usersFile, "utf8");

    users = file.trim()
        ? JSON.parse(file)
        : [];
}

// =====================================
// FIND EXISTING ADMIN
// =====================================

const existingAdmin = users.find(
    user => user.role === "admin"
);

// =====================================
// RESET OR CREATE ADMIN
// =====================================

if (existingAdmin) {

    existingAdmin.email = adminEmail;

    existingAdmin.password =
        bcrypt.hashSync(adminPassword, 10);

    existingAdmin.name =
        "JobHub Administrator";

    existingAdmin.status =
        "active";

    existingAdmin.suspensionReason =
        "";

    console.log("Existing admin account has been reset.");

} else {

    const newAdmin = {

        id: "admin-" + Date.now(),

        name: "JobHub Administrator",

        email: adminEmail,

        password:
            bcrypt.hashSync(adminPassword, 10),

        role: "admin",

        status: "active",

        suspensionReason: "",

        createdAt:
            new Date().toISOString()
    };

    users.push(newAdmin);

    console.log("New admin account created.");
}

// =====================================
// SAVE USERS
// =====================================

fs.writeFileSync(
    usersFile,
    JSON.stringify(users, null, 2)
);

// =====================================
// SHOW NEW LOGIN DETAILS
// =====================================

console.log("");
console.log("================================");
console.log("       JOBHUB ADMIN RECOVERY");
console.log("================================");
console.log("Email:   ", adminEmail);
console.log("Password:", adminPassword);
console.log("================================");