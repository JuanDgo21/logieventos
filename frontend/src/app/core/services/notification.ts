import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: Date;
  icon?: string;
  link?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private showPanelSubject = new BehaviorSubject<boolean>(false);

  // Observables públicos
  notifications$ = this.notificationsSubject.asObservable();
  unreadCount$ = this.unreadCountSubject.asObservable();
  showPanel$ = this.showPanelSubject.asObservable();

  constructor() {
    this.loadFromLocalStorage();
    this.updateUnreadCount();
  }

  // Métodos principales
  addNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): string {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      read: false,
      createdAt: new Date()
    };

    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [newNotification, ...currentNotifications];
    
    this.notificationsSubject.next(updatedNotifications);
    this.saveToLocalStorage(updatedNotifications);
    this.updateUnreadCount();

    return newNotification.id;
  }

  markAsRead(id: string): void {
    const notifications = this.notificationsSubject.value.map(n => 
      n.id === id ? { ...n, read: true } : n
    );

    this.notificationsSubject.next(notifications);
    this.saveToLocalStorage(notifications);
    this.updateUnreadCount();
  }

  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value.map(n => ({
      ...n,
      read: true
    }));

    this.notificationsSubject.next(notifications);
    this.saveToLocalStorage(notifications);
    this.updateUnreadCount();
  }

  removeNotification(id: string): void {
    const notifications = this.notificationsSubject.value.filter(n => n.id !== id);
    this.notificationsSubject.next(notifications);
    this.saveToLocalStorage(notifications);
    this.updateUnreadCount();
  }

  clearAll(): void {
    this.notificationsSubject.next([]);
    localStorage.removeItem('app_notifications');
    this.unreadCountSubject.next(0);
  }

  // Métodos de UI
  togglePanel(): void {
    this.showPanelSubject.next(!this.showPanelSubject.value);
  }

  openPanel(): void {
    this.showPanelSubject.next(true);
  }

  closePanel(): void {
    this.showPanelSubject.next(false);
  }

  // Métodos privados
  private updateUnreadCount(): void {
    const unread = this.notificationsSubject.value.filter(n => !n.read).length;
    this.unreadCountSubject.next(unread);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private saveToLocalStorage(notifications: Notification[]): void {
    localStorage.setItem('app_notifications', JSON.stringify(notifications));
  }

  private loadFromLocalStorage(): void {
    const saved = localStorage.getItem('app_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convertir strings de fecha a objetos Date
        const notifications = parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt)
        }));
        this.notificationsSubject.next(notifications);
      } catch (e) {
        console.error('Error loading notifications from localStorage', e);
        localStorage.removeItem('app_notifications');
      }
    }
  }
}