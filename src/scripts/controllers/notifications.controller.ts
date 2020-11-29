import { gameConfig } from '../config';

class NotificationsController {

  requestPermission(body = null) {
    Notification.requestPermission().then(result => {
      if (result === 'granted' && body) {
        this.show(body);
      }
    });
  }

  show(body) {
    if (Notification.permission === 'default') {
      this.requestPermission(body);
    }
    if (Notification.permission === 'granted') {
      const options = {body}
      new Notification(gameConfig.title, options);
    }
  }
}

export const notificationsController = new NotificationsController();
