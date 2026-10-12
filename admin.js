
// const bcrypt = require("bcryptjs");
// const fs = require("fs");
// const path = require("path");

// const usersFile = path.join(__dirname, "data", "users.json");

// const users = fs.existsSync(usersFile)
//     ? JSON.parse(fs.readFileSync(usersFile, "utf8") || "[]")
//     : [];

// const adminEmail = "admin@jobhub.com";
// const adminPassword = "Admin12345";

// const existingAdmin = users.find(
//     user => user.email.toLowerCase() === adminEmail
// );

// if (existingAdmin) {
//     console.log("Admin account already exists.");
//     process.exit();
// }

// const hashedPassword = bcrypt.hashSync(adminPassword, 10);

// const admin = {
//     id: "admin-" + Date.now(),
//     name: "JobHub Admin",
//     email: adminEmail,
//     password: hashedPassword,
//     role: "admin",
//     status: "active",
//     suspensionReason: "",
//     createdAt: new Date().toISOString()
// };

// users.push(admin);

// fs.writeFileSync(
//     usersFile,
//     JSON.stringify(users, null, 2)
// );

// console.log("================================");
// console.log("ADMIN ACCOUNT CREATED");
// console.log("Email:", adminEmail);
// console.log("Password:", adminPassword);
// console.log("================================");









const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const usersFile =
    path.join(
        __dirname,
        "data",
        "users.json"
    );


let users = [];


if (fs.existsSync(usersFile)) {

    const file =
        fs.readFileSync(
            usersFile,
            "utf8"
        );

    users =
        file.trim()
            ? JSON.parse(file)
            : [];

}


const adminEmail =
    "iniub5319@gmail.com";

const adminPassword =
    "Iniub123";


const existingAdmin =
    users.find(
        user =>
            user.email.toLowerCase() ===
            adminEmail
    );


if (existingAdmin) {

    console.log(
        "Admin account already exists."
    );

    process.exit();

}


const hashedPassword =
    bcrypt.hashSync(
        adminPassword,
        10
    );


const admin = {

    id:
        "admin-" +
        Date.now(),

    name:
        "JobHub Administrator",

    email:
        adminEmail,

    password:
        hashedPassword,

    role:
        "admin",

    status:
        "active",

    suspensionReason:
        "",

    createdAt:
        new Date().toISOString()

};


users.push(admin);


fs.writeFileSync(
    usersFile,
    JSON.stringify(
        users,
        null,
        2
    )
);


console.log("");
console.log(
    "===================================="
);
console.log(
    "       JOBHUB ADMIN CREATED"
);
console.log(
    "===================================="
);
console.log(
    "Email:    admin@jobhub.com"
);
console.log(
    "Password: Admin12345"
);
console.log(
    "===================================="
);
console.log("");