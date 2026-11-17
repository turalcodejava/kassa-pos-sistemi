import { Request, Response } from "express";
import { expenseService } from "../services/expenseService.js";
import { db } from "../db/database.js";

export class ExpenseController {
  public getAll(req: Request, res: Response) {
    const expenses = expenseService.getAllExpenses();
    res.json({ success: true, expenses, state: db.getState() });
  }

  public handleExpenseAction(req: Request, res: Response) {
    const { action, expense } = req.body;

    if (action === "ADD") {
      expenseService.addExpense(expense);
    } else if (action === "CONFIRM") {
      expenseService.confirmExpense(expense.id, expense.isConfirmed !== false, expense.confirmedBy);
    } else if (action === "DELETE") {
      expenseService.deleteExpense(expense.id);
    } else {
      return res.status(400).json({ error: "Yanlış əməliyyat" });
    }

    res.json({ success: true, state: db.getState(), version: db.getVersion().version });
  }
}

export const expenseController = new ExpenseController();
