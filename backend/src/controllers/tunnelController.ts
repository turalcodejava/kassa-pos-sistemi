import { Request, Response } from "express";

interface TunnelInstance {
  getURL: () => Promise<string>;
  close: () => Promise<void>;
}

class TunnelController {
  private activeTunnel: TunnelInstance | null = null;
  private activeUrl: string | null = null;
  private isStarting: boolean = false;

  public getActiveUrl(): string | null {
    return this.activeUrl;
  }

  async getStatus(req: Request, res: Response) {
    res.json({
      success: true,
      active: !!this.activeUrl,
      url: this.activeUrl
    });
  }

  async start(req: Request, res: Response) {
    if (this.activeUrl) {
      return res.json({
        success: true,
        url: this.activeUrl,
        alreadyRunning: true
      });
    }

    if (this.isStarting) {
      return res.json({
        success: false,
        message: "Tünel artıq başladılır, zəhmət olmasa bir neçə saniyə gözləyin..."
      });
    }

    this.isStarting = true;

    try {
      const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

      // Method 1: Cloudflare Quick Tunnel via untun
      try {
        const { startTunnel } = await import("untun");
        const tunnel = await startTunnel({
          port,
          hostname: "localhost"
        });

        const url = await tunnel.getURL();
        if (url) {
          this.activeTunnel = tunnel;
          this.activeUrl = url;
          this.isStarting = false;
          console.log("🌐 Cloudflare Onlayn Menyu Tüneli aktivləşdirildi:", url);
          return res.json({
            success: true,
            url: this.activeUrl,
            provider: "cloudflare"
          });
        }
      } catch (cfErr) {
        console.warn("Cloudflare tüneli xətası, localtunnel yoxlanılır:", cfErr);
      }

      // Method 2: Localtunnel fallback
      try {
        const localtunnelModule = await import("localtunnel");
        const localtunnel = localtunnelModule.default || localtunnelModule;
        const lt = await localtunnel({ port });
        if (lt && lt.url) {
          this.activeTunnel = {
            getURL: async () => lt.url,
            close: async () => { lt.close(); }
          };
          this.activeUrl = lt.url;
          this.isStarting = false;
          console.log("🌐 Localtunnel Onlayn Menyu Tüneli aktivləşdirildi:", lt.url);
          return res.json({
            success: true,
            url: this.activeUrl,
            provider: "localtunnel"
          });
        }
      } catch (ltErr) {
        console.error("Localtunnel xətası:", ltErr);
      }

      this.isStarting = false;
      return res.status(500).json({
        success: false,
        error: "Onlayn tünel bağlantısı qurula bilmədi. İnternet bağlantınızı yoxlayın."
      });
    } catch (error) {
      this.isStarting = false;
      return res.status(500).json({
        success: false,
        error: String(error)
      });
    }
  }

  async stop(req: Request, res: Response) {
    try {
      if (this.activeTunnel) {
        await this.activeTunnel.close().catch(() => {});
        this.activeTunnel = null;
        this.activeUrl = null;
      }
      res.json({ success: true, message: "Onlayn tünel dayandırıldı." });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err) });
    }
  }
}

export const tunnelController = new TunnelController();
