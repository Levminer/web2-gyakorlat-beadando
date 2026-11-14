const router = require("express").Router();
const controller = require("../controllers/mainController");
const pizzaController = require("../controllers/pizzaController");
const messageController = require("../controllers/messageController");
const { isLoggedIn, isAdmin, isGuest } = require("../middleware/auth");

router.get("/", pizzaController.home);
router.get("/adatbazis", pizzaController.database);

router.get("/register", isGuest, controller.registerGet);
router.post("/register", isGuest, controller.registerPost);
router.get("/login", isGuest, controller.loginGet);
router.post("/login", isGuest, controller.loginPost);
router.get("/logout", controller.logout);

// Regisztrált látogató
router.get("/uzenetek", isLoggedIn, messageController.index);
router.get("/diagram", isLoggedIn, controller.chartIndex);

// Admin
router.get("/crud", isAdmin, controller.crudIndex);

module.exports = router;
