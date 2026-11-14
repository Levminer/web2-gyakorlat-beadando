const router = require("express").Router();
const controller = require("../controllers/mainController");
const pizzaController = require("../controllers/pizzaController");
const messageController = require("../controllers/messageController");
const crudController = require("../controllers/crudController");
const { isLoggedIn, isAdmin, isGuest } = require("../middleware/auth");

router.get("/", pizzaController.home);
router.get("/adatbazis", pizzaController.database);
router.get("/kapcsolat", messageController.contactGet);
router.post("/kapcsolat", messageController.contactRules, messageController.contactPost);

router.get("/register", isGuest, controller.registerGet);
router.post("/register", isGuest, controller.registerPost);
router.get("/login", isGuest, controller.loginGet);
router.post("/login", isGuest, controller.loginPost);
router.get("/logout", controller.logout);

// Regisztrált látogató
router.get("/uzenetek", isLoggedIn, messageController.index);
router.get("/diagram", isLoggedIn, controller.chartIndex);

// Admin: pizzák kezelése
router.get("/crud", isAdmin, crudController.index);
router.get("/crud/uj", isAdmin, crudController.newGet);
router.post("/crud/uj", isAdmin, crudController.pizzaRules, crudController.create);
router.get("/crud/:id/szerkesztes", isAdmin, crudController.editGet);
router.post("/crud/:id/szerkesztes", isAdmin, crudController.pizzaRules, crudController.update);
router.get("/crud/:id/torles", isAdmin, crudController.deleteGet);
router.post("/crud/:id/torles", isAdmin, crudController.delete);

module.exports = router;
