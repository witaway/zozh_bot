module.exports = (time, unit) => {

    let pre_last = Math.floor(time / 10);
    let last = time % 10;
    let result = `${String(time)} `;
    
    if(unit == 'sec') {
        if(pre_last == 1) {
            result += 'секунд'
        } else {
            if(last === 1) result += 'секунду'
            else if(last >= 2 && last <= 4) result += 'секунды'
            else result += 'секунд'
        }
    }

    if(unit == 'min') {
        if(pre_last == 1) {
            result += 'минут'
        } else {
            if(last === 1) result += 'минуту'
            else if(last >= 2 && last <= 4) result += 'минуту'
            else result += 'минут'
        }
    }

    if(unit == 'hour') {
        if(pre_last == 1) {
            result += 'часов'
        } else {
            if(last === 1) result += 'час'
            else if(last >= 2 && last <= 4) result += 'часа'
            else result += 'часов'
        }
    }

    if(unit == 'day') {
        if(pre_last == 1) {
            result += 'дней'
        } else {
            if(last === 1) result += 'день'
            else if(last >= 2 && last <= 4) result += 'дня'
            else result += 'дней'
        }
    }
   
    return result;
}