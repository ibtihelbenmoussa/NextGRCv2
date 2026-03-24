import dayjs from 'dayjs';
import fr from 'dayjs/locale/fr';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
dayjs.locale(fr);

const DateTimeColumn = ({ date }: { date: Date | string }) => {
    const dateObj = new Date(date);
    const fromNow = dayjs(dateObj).fromNow();
    return (
        <div className="flex flex-col">
            <span className="text-xs">{dateObj.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">{fromNow}</span>
        </div>
    );
};

export default DateTimeColumn;
