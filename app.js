const express = require("express");
const app = express();

// Invocar dotenv
const dotenv = require("dotenv");
dotenv.config({ path: "./env/.env" });

// Capturar datos del formulario
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Motor de plantillas
app.set("view engine", "ejs");
// Bcryptjs
const bc = require("bcryptjs");

// Variables de sesión
const session = require("express-session");
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

// Conexión a la DB
const connection = require("./database/db");

const bcryptjs = require("bcryptjs");

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const name = req.body.name;
  const user = req.body.user;
  const rol = req.body.rol;
  const pass = req.body.pass;
  let passHash = await bcryptjs.hash(pass, 8);

  connection.query(
    "INSERT INTO users SET ?",
    { user: user, name: name, rol: rol, pass: passHash },
    async (err, results) => {
      if (err) {
        console.log(err);
      } else {
        res.render("register", {
          alert: true,
          alertTitle: "Registration!",
          alertMessage: "Succesful Registration",
          alertIcon: "success",
          showConfirmButton: false,
          timer: 2000,
          ruta: "",
        });
      }
    }
  );
});

// Autenticaciones
app.post("/auth", async (req, res) => {
  const user = req.body.user;
  const pass = req.body.pass;
  // let passHash = await bcryptjs.hash(pass, 8);

  if (user && pass) {
    connection.query(
      "SELECT * FROM users WHERE user = ?",
      [user],
      async (err, results) => {
        if (
          results.length == 0 ||
          !(await bcryptjs.compare(pass, results[0].pass))
        ) {
          res.render("login", {
            alert: true,
            alertTitle: "Error!",
            alertMessage: "User and/or password are incorrect",
            alertIcon: "error",
            showConfirmButton: true,
            timer: 2000,
            ruta: "login",
          });
        } else {
          req.session.loggedin = true;
          req.session.name = results[0].name;
          res.render("login", {
            alert: true,
            alertTitle: "Correct login!",
            alertMessage: "Succesful Connection.",
            alertIcon: "success",
            showConfirmButton: false,
            timer: 2000,
            ruta: "",
          });
        }
      }
    );
  }
});

// Auth páginas
app.get("/", (req, res) => {
  if (req.session.loggedin) {
    res.render("index", {
      login: true,
      name: req.session.name,
    });
  } else {
    res.render("index", {
      login: false,
      name: "Welcome!",
    });
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, (req, res) => {
  console.log(`Servidor ok en http://localhost:${PORT}`);
});
