import { db } from "../db/database.js";
import { User } from "../types.js";

export class UserService {
  public getAllUsers(): User[] {
    return db.getState().users || [];
  }

  public authenticate(pin: string): User | null {
    const users = db.getState().users || [];
    return users.find(u => u.pin === pin) || null;
  }

  public getUserById(id: string): User | undefined {
    return db.getState().users?.find(u => u.id === id);
  }

  public addUser(user: Partial<User>): { success: boolean; user?: User; error?: string } {
    const name = user.name?.trim();
    const pin = user.pin?.trim();
    const role = user.role || "CASHIER";

    if (!name) {
      return { success: false, error: "İstifadəçi adı boş ola bilməz!" };
    }
    if (!pin || pin.length < 4) {
      return { success: false, error: "PIN kod ən azı 4 rəqəmdən ibarət olmalıdır!" };
    }

    const state = db.getState();
    const pinExists = state.users?.some(u => u.pin === pin);
    if (pinExists) {
      return { success: false, error: "Bu PIN kod artıq başqa istifadəçiyə təyin edilib!" };
    }

    const newUser: User = {
      id: "u_" + Date.now(),
      name,
      pin,
      role
    };

    db.mutate(s => {
      if (!s.users) s.users = [];
      s.users.push(newUser);
    });

    return { success: true, user: newUser };
  }

  public updateUser(user: Partial<User> & { id: string }): { success: boolean; user?: User; error?: string } {
    let result: { success: boolean; user?: User; error?: string } = { success: false, error: "İstifadəçi tapılmadı" };

    db.mutate(s => {
      const idx = s.users?.findIndex(u => u.id === user.id) ?? -1;
      if (idx !== -1 && s.users) {
        if (user.pin) {
          const pinConflict = s.users.some(u => u.pin === user.pin && u.id !== user.id);
          if (pinConflict) {
            result = { success: false, error: "Bu PIN kod artıq başqa istifadəçiyə təyin edilib!" };
            return;
          }
        }

        s.users[idx] = {
          ...s.users[idx],
          name: user.name?.trim() || s.users[idx].name,
          pin: user.pin?.trim() || s.users[idx].pin,
          role: user.role || s.users[idx].role
        };
        result = { success: true, user: s.users[idx] };
      }
    });

    return result;
  }

  public deleteUser(id: string): { success: boolean; error?: string } {
    let deleted = false;
    let error: string | undefined = undefined;

    db.mutate(s => {
      const target = s.users?.find(u => u.id === id);
      if (!target) {
        error = "İstifadəçi tapılmadı";
        return;
      }
      if (target.role === "ADMIN" && s.users?.filter(u => u.role === "ADMIN").length <= 1) {
        error = "Sonuncu Admin istifadəçisini silmək olmaz!";
        return;
      }

      const initLen = s.users?.length || 0;
      s.users = s.users?.filter(u => u.id !== id) || [];
      deleted = (s.users.length < initLen);
    });

    return { success: deleted, error };
  }
}

export const userService = new UserService();
