import Extend from 'flarum/common/extenders';
import { WishNotification, DayNotification } from './notifications';

export default [new Extend.Notification().add('fanfareWish', WishNotification).add('fanfareDay', DayNotification)];
