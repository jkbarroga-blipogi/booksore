import { Router } from "express";

export function createApiRouter({
  bookController,
  authController,
  userController,
  requireAuth,
  requireAdmin,
}) {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "booksore",
      timestamp: new Date().toISOString(),
    });
  });

  router.post("/auth/register", authController.register);
  router.post("/auth/login", authController.login);
  router.post("/auth/admin/login", authController.loginAdmin);
  router.post("/auth/logout", authController.logout);
  router.get("/auth/me", authController.me);

  router.get("/books", requireAuth, bookController.list);
  router.get("/books/:id", requireAuth, bookController.getById);
  router.post("/books", requireAdmin, bookController.create);
  router.patch("/books/:id", requireAdmin, bookController.update);
  router.delete("/books/:id", requireAdmin, bookController.remove);

  router.post("/checkout", requireAuth, bookController.checkout);
  router.get("/orders/my-orders", requireAuth, bookController.myOrders);

  router.get("/users", requireAdmin, userController.list);
  router.patch("/users/:id/role", requireAdmin, userController.updateRole);

  return router;
}
