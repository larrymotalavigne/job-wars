import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CurrencyBalance, CurrencyTransaction, CurrencyType } from '../models/currency.model';

/**
 * Currency Service
 * Manages coins and gems for the player with transaction history
 */
@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private readonly STORAGE_KEY = 'jobwars-currency';
  private readonly VERSION_KEY = 'jobwars-currency-version';
  private readonly TRANSACTIONS_KEY = 'jobwars-currency-transactions';
  private readonly CURRENT_VERSION = 1;
  private readonly MAX_TRANSACTIONS = 100;

  private balanceSubject = new BehaviorSubject<CurrencyBalance>(this.getDefaultBalance());
  public balance$: Observable<CurrencyBalance> = this.balanceSubject.asObservable();

  private transactionsSubject = new BehaviorSubject<CurrencyTransaction[]>([]);
  public transactions$: Observable<CurrencyTransaction[]> = this.transactionsSubject.asObservable();

  constructor() {}

  /**
   * Initialize currency system - load from storage or create new
   */
  initializeCurrency(): void {
    try {
      const storedVersion = localStorage.getItem(this.VERSION_KEY);
      const storedBalance = localStorage.getItem(this.STORAGE_KEY);
      const storedTransactions = localStorage.getItem(this.TRANSACTIONS_KEY);

      if (storedVersion === this.CURRENT_VERSION.toString() && storedBalance) {
        const balance = JSON.parse(storedBalance) as CurrencyBalance;
        this.balanceSubject.next(balance);
      } else {
        // New player or version mismatch - create default balance
        const defaultBalance = this.getDefaultBalance();
        this.saveBalance(defaultBalance);
        this.balanceSubject.next(defaultBalance);
        localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION.toString());
      }

      if (storedTransactions) {
        const transactions = JSON.parse(storedTransactions) as CurrencyTransaction[];
        this.transactionsSubject.next(transactions);
      }
    } catch (error) {
      console.error('Error initializing currency:', error);
      const defaultBalance = this.getDefaultBalance();
      this.balanceSubject.next(defaultBalance);
      this.saveBalance(defaultBalance);
    }
  }

  /**
   * Get current balance snapshot
   */
  getBalance(): CurrencyBalance {
    return this.balanceSubject.value;
  }

  /**
   * Add currency to player balance
   */
  addCurrency(type: CurrencyType, amount: number, reason: string): void {
    if (amount <= 0) {
      console.warn('Cannot add non-positive amount:', amount);
      return;
    }

    const currentBalance = this.getBalance();
    const newBalance: CurrencyBalance = {
      ...currentBalance,
      coins: type === 'Pièces' ? currentBalance.coins + amount : currentBalance.coins,
      gems: type === 'Gemmes' ? currentBalance.gems + amount : currentBalance.gems,
      lifetimeCoins: type === 'Pièces' ? currentBalance.lifetimeCoins + amount : currentBalance.lifetimeCoins,
      lifetimeGems: type === 'Gemmes' ? currentBalance.lifetimeGems + amount : currentBalance.lifetimeGems,
      lastUpdated: Date.now()
    };

    this.balanceSubject.next(newBalance);
    this.saveBalance(newBalance);

    // Record transaction
    this.recordTransaction({
      id: this.generateTransactionId(),
      type,
      amount,
      reason,
      timestamp: Date.now(),
      balance: type === 'Pièces' ? newBalance.coins : newBalance.gems
    });
  }

  /**
   * Spend currency from player balance
   * Returns true if successful, false if insufficient funds
   */
  spendCurrency(type: CurrencyType, amount: number, reason: string): boolean {
    if (amount <= 0) {
      console.warn('Cannot spend non-positive amount:', amount);
      return false;
    }

    const currentBalance = this.getBalance();
    const currentAmount = type === 'Pièces' ? currentBalance.coins : currentBalance.gems;

    if (currentAmount < amount) {
      console.warn(`Insufficient ${type}. Has ${currentAmount}, needs ${amount}`);
      return false;
    }

    const newBalance: CurrencyBalance = {
      ...currentBalance,
      coins: type === 'Pièces' ? currentBalance.coins - amount : currentBalance.coins,
      gems: type === 'Gemmes' ? currentBalance.gems - amount : currentBalance.gems,
      lastUpdated: Date.now()
    };

    this.balanceSubject.next(newBalance);
    this.saveBalance(newBalance);

    // Record transaction (negative amount for spending)
    this.recordTransaction({
      id: this.generateTransactionId(),
      type,
      amount: -amount,
      reason,
      timestamp: Date.now(),
      balance: type === 'Pièces' ? newBalance.coins : newBalance.gems
    });

    return true;
  }

  /**
   * Check if player has enough currency
   */
  hasEnough(coins: number = 0, gems: number = 0): boolean {
    const balance = this.getBalance();
    return balance.coins >= coins && balance.gems >= gems;
  }

  /**
   * Get transaction history (most recent first)
   */
  getTransactionHistory(): CurrencyTransaction[] {
    return [...this.transactionsSubject.value].reverse();
  }

  /**
   * Clear all transactions (for testing/debugging)
   */
  clearTransactionHistory(): void {
    this.transactionsSubject.next([]);
    localStorage.removeItem(this.TRANSACTIONS_KEY);
  }

  /**
   * Reset currency to default (for testing/debugging)
   */
  resetCurrency(): void {
    const defaultBalance = this.getDefaultBalance();
    this.balanceSubject.next(defaultBalance);
    this.saveBalance(defaultBalance);
    this.clearTransactionHistory();
  }

  // Private helper methods

  private getDefaultBalance(): CurrencyBalance {
    return {
      coins: 100,        // Starting coins
      gems: 50,          // Starting gems
      lifetimeCoins: 100,
      lifetimeGems: 50,
      lastUpdated: Date.now()
    };
  }

  private saveBalance(balance: CurrencyBalance): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(balance));
      localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION.toString());
    } catch (error) {
      console.error('Error saving currency balance:', error);
    }
  }

  private recordTransaction(transaction: CurrencyTransaction): void {
    const transactions = [...this.transactionsSubject.value];
    transactions.push(transaction);

    // Keep only last MAX_TRANSACTIONS
    if (transactions.length > this.MAX_TRANSACTIONS) {
      transactions.shift();
    }

    this.transactionsSubject.next(transactions);
    this.saveTransactions(transactions);
  }

  private saveTransactions(transactions: CurrencyTransaction[]): void {
    try {
      localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  }

  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
