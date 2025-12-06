import { Request, Response, Express } from "express";

interface HealthControllerDeps {
  app: Express;
}

class HealthController {
  private app: Express;

  /**
   * Constructor
   * @param deps Dependencies
   */
  constructor(deps: HealthControllerDeps) {
    this.app = deps.app;
  }

  /**
   * Creates an instance
   * @param server Server instance
   * @returns HealthController instance
   */
  static create(server: { app: Express }): HealthController {
    return new HealthController({
      app: server.app
    });
  }

  /**
   * Initialize routes
   */
  initialize(): void {
    this.app.get("/v1/health", this.handleHealth.bind(this));
  }

  /**
   * Handle health check
   * @param _req Request
   * @param res Response
   */
  handleHealth(_req: Request, res: Response): Response {
    return res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString()
    });
  }
}

export default HealthController;
