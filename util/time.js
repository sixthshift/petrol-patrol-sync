module.exports = {
    currentLocalTime() {
        return new Date().toLocaleDateString(undefined, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    },
    parseTimestamp(timestamp) {
        const timetstampArray = timestamp.split(/(\/| |:)/);
        const decomposition = {
            day: timetstampArray[0],
            month: timetstampArray[2],
            year: timetstampArray[4],
            hour: timetstampArray[6],
            minute: timetstampArray[8],
            second: timetstampArray[10]
        };
        return new Date(
            decomposition.year,
            decomposition.month,
            decomposition.day,
            decomposition.hour,
            decomposition.minute,
            decomposition.second,
        );
    }
}