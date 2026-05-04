let state = {
    thunder: false,
    motion: true,
    autoThunder: false,
    autoNoOne: false,
    lights: {
        kitchen: { on: false, brightness: 0 },
        living: { on: false, brightness: 0 },
        bedroom: { on: false, brightness: 0 }
    },
    washer: {
        status: 'stopped',
        program: 'cotton',
        time: 60,
        temperature: 40,
        waterUsed: 0,
        timer: null
    },
    router: {
        power: 100,
        rebooting: false,
        on: true,
        speed: 100,
        interval: null
    }
};

let absenceTimer = null;

document.addEventListener('DOMContentLoaded', function() {
    updateUI();
    startRouterSpeedSimulation();
    updateAllButtons();
    
    document.querySelectorAll('.program-btn').forEach(btn => {
        if (btn.dataset.program === state.washer.program) {
            btn.classList.add('active');
        }
    });
});

function updateAllButtons() {
    updateThunderButtons();
    updateMotionButtons();
    updateLightButtons();
    updateWasherButtons();
    updateRouterButtons();
}

function updateThunderButtons() {
    const onBtn = document.getElementById('thunderOnBtn');
    const offBtn = document.getElementById('thunderOffBtn');
    if (onBtn && offBtn) {
        if (state.thunder) {
            onBtn.classList.add('active');
            offBtn.classList.remove('active');
        } else {
            onBtn.classList.remove('active');
            offBtn.classList.add('active');
        }
    }
}

function updateMotionButtons() {
    const onBtn = document.getElementById('motionOnBtn');
    const offBtn = document.getElementById('motionOffBtn');
    if (onBtn && offBtn) {
        if (state.motion) {
            onBtn.classList.add('active');
            offBtn.classList.remove('active');
        } else {
            onBtn.classList.remove('active');
            offBtn.classList.add('active');
        }
    }
}

function updateLightButtons() {
    ['kitchen', 'living', 'bedroom'].forEach(room => {
        const onBtn = document.getElementById(`${room}LightOnBtn`);
        const offBtn = document.getElementById(`${room}LightOffBtn`);
        if (onBtn && offBtn) {
            if (state.lights[room].on) {
                onBtn.classList.add('active');
                offBtn.classList.remove('active');
            } else {
                onBtn.classList.remove('active');
                offBtn.classList.add('active');
            }
        }
    });
}

function updateWasherButtons() {
    const startBtn = document.getElementById('washerStartBtn');
    const pauseBtn = document.getElementById('washerPauseBtn');
    const stopBtn = document.getElementById('washerStopBtn');
    
    if (startBtn && pauseBtn && stopBtn) {
        startBtn.classList.remove('active');
        pauseBtn.classList.remove('active');
        stopBtn.classList.remove('active');
        
        if (state.washer.status === 'running') {
            startBtn.classList.add('active');
        } else if (state.washer.status === 'paused') {
            pauseBtn.classList.add('active');
        } else if (state.washer.status === 'stopped') {
            stopBtn.classList.add('active');
        }
    }
}

function updateRouterButtons() {
    const onBtn = document.getElementById('routerOnBtn');
    const offBtn = document.getElementById('routerOffBtn');
    const rebootBtn = document.getElementById('routerRebootBtn');
    
    if (onBtn && offBtn && rebootBtn) {
        onBtn.classList.remove('active');
        offBtn.classList.remove('active');
        rebootBtn.classList.remove('active');
        
        if (state.router.on && !state.router.rebooting) {
            onBtn.classList.add('active');
        } else if (!state.router.on && !state.router.rebooting) {
            offBtn.classList.add('active');
        } else if (state.router.rebooting) {
            rebootBtn.classList.add('active');
        }
    }
}

function updateUI() {
    const thunderStatus = document.getElementById('thunderStatus');
    thunderStatus.textContent = state.thunder ? 'АКТИВЕН' : 'Выключен';
    thunderStatus.className = 'sensor-status ' + (state.thunder ? 'active' : '');
    
    const motionStatus = document.getElementById('motionStatus');
    motionStatus.textContent = state.motion ? 'Есть движение' : 'Нет движения';
    motionStatus.className = 'sensor-status ' + (!state.motion ? 'no-motion' : '');
    
    ['kitchen', 'living', 'bedroom'].forEach(room => {
        const lightStatus = document.getElementById(room + 'LightStatus');
        const brightnessValue = document.getElementById(room + 'BrightnessValue');
        const slider = document.getElementById(room + 'Brightness');
        
        if (lightStatus) {
            lightStatus.textContent = state.lights[room].on ? 'Вкл' : 'Выкл';
            lightStatus.className = 'light-status ' + (state.lights[room].on ? 'on' : '');
        }
        if (brightnessValue) brightnessValue.textContent = state.lights[room].brightness + '%';
        if (slider) slider.value = state.lights[room].brightness;
    });
    
    const washerStatus = document.getElementById('washerStatus');
    const statusText = {
        stopped: 'Остановлена',
        running: 'Стирка...',
        paused: 'На паузе'
    };
    if (washerStatus) {
        washerStatus.textContent = statusText[state.washer.status];
        washerStatus.className = 'washer-status ' + state.washer.status;
    }
    
    const waterUsedSpan = document.getElementById('washerWaterUsed');
    if (waterUsedSpan) waterUsedSpan.textContent = state.washer.waterUsed;
    
    const routerPowerSpan = document.getElementById('routerPower');
    if (routerPowerSpan) routerPowerSpan.textContent = state.router.power;
    
    const routerPowerSlider = document.getElementById('routerPowerSlider');
    if (routerPowerSlider) routerPowerSlider.value = state.router.power;
    
    const routerStatusText = document.getElementById('routerStatusText');
    if (routerStatusText) {
        routerStatusText.textContent = state.router.rebooting ? 'Перезагрузка...' : (state.router.on ? 'Работает' : 'Выключен');
    }
    
    updateAllButtons();
}

function addNotification(message, type = 'info') {
    const list = document.getElementById('notificationsList');
    if (!list) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    list.insertBefore(notification, list.firstChild);
    
    while (list.children.length > 15) {
        list.removeChild(list.lastChild);
    }
    
    setTimeout(() => {
        if (notification.parentNode) notification.remove();
    }, 8000);
}

function clearNotifications() {
    const list = document.getElementById('notificationsList');
    if (list) list.innerHTML = '';
    addNotification('Все уведомления очищены', 'info');
}

function toggleThunder() {
    state.thunder = !state.thunder;
    addNotification(state.thunder ? 'Гроза началась' : 'Гроза закончилась', state.thunder ? 'error' : 'info');
    updateUI();
    if (state.thunder) checkAutoThunder();
}

function clearThunder() {
    if (state.thunder) {
        state.thunder = false;
        addNotification('Гроза закончилась', 'info');
        updateUI();
    }
}

function setMotion(hasMotion) {
    state.motion = hasMotion;
    addNotification(hasMotion ? 'Движение есть' : 'Движения нет', 'info');
    updateUI();
    
    if (!hasMotion && state.autoNoOne) {
        if (absenceTimer) clearTimeout(absenceTimer);
        absenceTimer = setTimeout(() => {
            if (!state.motion && state.autoNoOne) {
                executeNoOneScenario();
            }
        }, 10000);
    } else if (hasMotion && absenceTimer) {
        clearTimeout(absenceTimer);
        absenceTimer = null;
    }
}

function toggleAutoThunder(checked) {
    state.autoThunder = checked;
    addNotification(checked ? 'Автосценарий "Гроза" включён' : 'Автосценарий "Гроза" выключен', 'info');
    if (checked && state.thunder) checkAutoThunder();
}

function toggleAutoNoOne(checked) {
    state.autoNoOne = checked;
    addNotification(checked ? 'Автосценарий "Никого нет" включён' : 'Автосценарий "Никого нет" выключен', 'info');
    if (checked && !state.motion) {
        if (absenceTimer) clearTimeout(absenceTimer);
        absenceTimer = setTimeout(() => {
            if (!state.motion && state.autoNoOne) executeNoOneScenario();
        }, 10000);
    } else if (!checked && absenceTimer) {
        clearTimeout(absenceTimer);
        absenceTimer = null;
    }
}

function checkAutoThunder() {
    if (state.autoThunder && state.thunder) executeThunderScenario();
}

function executeThunderScenario() {
    addNotification('СЦЕНАРИЙ "ГРОЗА" АКТИВИРОВАН!', 'error');
    
    for (let room in state.lights) {
        state.lights[room].on = false;
        state.lights[room].brightness = 0;
    }
    
    if (state.washer.status === 'running') {
        if (state.washer.timer) clearTimeout(state.washer.timer);
        state.washer.status = 'paused';
        addNotification('Стиральная машина на паузе', 'warning');
    }
    
    state.router.power = 30;
    addNotification('Мощность роутера снижена до 30%', 'warning');
    updateUI();
}

function executeNoOneScenario() {
    addNotification('СЦЕНАРИЙ "НИКОГО НЕТ" АКТИВИРОВАН!', 'warning');
    
    for (let room in state.lights) {
        state.lights[room].on = false;
        state.lights[room].brightness = 0;
    }
    addNotification('Весь свет выключен', 'info');
    
    if (state.washer.status !== 'stopped') {
        if (state.washer.timer) clearTimeout(state.washer.timer);
        state.washer.status = 'stopped';
        addNotification('Стиральная машина остановлена', 'warning');
    }
    updateUI();
}

function turnLightOn(room) {
    if (!state.lights[room].on) {
        if (state.lights[room].brightness === 0) state.lights[room].brightness = 50;
        state.lights[room].on = true;
        const roomNames = { kitchen: 'кухни', living: 'гостиной', bedroom: 'спальни' };
        addNotification(`Свет ${roomNames[room]} включён`, 'info');
        updateUI();
    }
}

function turnLightOff(room) {
    if (state.lights[room].on) {
        state.lights[room].on = false;
        const roomNames = { kitchen: 'кухни', living: 'гостиной', bedroom: 'спальни' };
        addNotification(`Свет ${roomNames[room]} выключен`, 'info');
        updateUI();
    }
}

function setBrightness(room, value) {
    const brightness = parseInt(value);
    state.lights[room].brightness = brightness;
    if (brightness === 0) {
        state.lights[room].on = false;
    } else if (brightness > 0 && !state.lights[room].on) {
        state.lights[room].on = true;
    }
    const roomNames = { kitchen: 'кухни', living: 'гостиной', bedroom: 'спальни' };
    addNotification(`Яркость света ${roomNames[room]} изменена на ${brightness}%`, 'info');
    updateUI();
}

function updateWasherProgram(program) {
    state.washer.program = program;
    document.querySelectorAll('.program-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.program === program) btn.classList.add('active');
    });
    const programNames = { cotton: 'Хлопок', delicate: 'Деликатная', synthetic: 'Синтетика', quick: 'Быстрая' };
    addNotification(`Выбрана программа: ${programNames[program]}`, 'info');
}

function updateWasherTime(time) {
    state.washer.time = parseInt(time);
    addNotification(`Время стирки: ${time} минут`, 'info');
}

function updateWasherTemp(temp) {
    state.washer.temperature = parseInt(temp);
    addNotification(`Температура: ${temp}°C`, 'info');
}

function calculateWaterUsage() {
    let waterPerMinute = 1.2;
    switch (state.washer.program) {
        case 'cotton': waterPerMinute = 1.5; break;
        case 'quick': waterPerMinute = 0.8; break;
        case 'delicate': waterPerMinute = 1.0; break;
        case 'synthetic': waterPerMinute = 1.2; break;
    }
    return Math.round(state.washer.time * waterPerMinute);
}

function washerStart() {
    if (state.washer.status === 'running') {
        addNotification('Стиральная машина уже работает', 'warning');
        return;
    }
    if (state.washer.timer) clearTimeout(state.washer.timer);
    state.washer.waterUsed = calculateWaterUsage();
    state.washer.status = 'running';
    const programNames = { cotton: 'Хлопок', delicate: 'Деликатная', synthetic: 'Синтетика', quick: 'Быстрая' };
    addNotification(`СТИРКА НАЧАТА! Программа: ${programNames[state.washer.program]}, Время: ${state.washer.time} мин, Температура: ${state.washer.temperature}°C`, 'info');
    state.washer.timer = setTimeout(() => {
        if (state.washer.status === 'running') {
            state.washer.status = 'stopped';
            addNotification(`СТИРКА ЗАВЕРШЕНА! Израсходовано ${state.washer.waterUsed} литров воды`, 'info');
            updateUI();
        }
    }, state.washer.time * 1000);
    updateUI();
}

function washerPause() {
    if (state.washer.status === 'running') {
        if (state.washer.timer) clearTimeout(state.washer.timer);
        state.washer.status = 'paused';
        addNotification('Стиральная машина на паузе', 'warning');
    } else if (state.washer.status === 'paused') {
        state.washer.status = 'running';
        state.washer.timer = setTimeout(() => {
            if (state.washer.status === 'running') {
                state.washer.status = 'stopped';
                addNotification(`СТИРКА ЗАВЕРШЕНА! Израсходовано ${state.washer.waterUsed} литров воды`, 'info');
                updateUI();
            }
        }, state.washer.time * 1000);
        addNotification('Стирка возобновлена', 'info');
    } else {
        addNotification('Стиральная машина не работает', 'warning');
        return;
    }
    updateUI();
}

function washerStop() {
    if (state.washer.status === 'stopped') {
        addNotification('Стиральная машина уже остановлена', 'warning');
        return;
    }
    if (state.washer.timer) clearTimeout(state.washer.timer);
    state.washer.status = 'stopped';
    addNotification('Стиральная машина остановлена', 'error');
    updateUI();
}

function startRouterSpeedSimulation() {
    if (state.router.interval) clearInterval(state.router.interval);
    state.router.interval = setInterval(() => {
        if (state.router.on && !state.router.rebooting) {
            const variation = (Math.random() - 0.5) * 30;
            let newSpeed = state.router.speed + variation;
            newSpeed = Math.max(10, Math.min(100, newSpeed));
            state.router.speed = Math.round(newSpeed);
            const speedElement = document.getElementById('routerSpeedValue');
            if (speedElement) speedElement.textContent = state.router.speed + ' Мбит/с';
            const loadElement = document.getElementById('routerLoadValue');
            if (loadElement) loadElement.textContent = Math.floor(Math.random() * 100) + '%';
        }
    }, 2000);
}

function routerOn() {
    if (!state.router.on) {
        state.router.on = true;
        addNotification('Роутер включен', 'info');
        updateUI();
    }
}

function routerOff() {
    if (state.router.on) {
        state.router.on = false;
        state.router.speed = 0;
        addNotification('Роутер выключен', 'warning');
        updateUI();
    }
}

function routerReboot() {
    if (state.router.rebooting) {
        addNotification('Роутер уже перезагружается', 'warning');
        return;
    }
    state.router.rebooting = true;
    addNotification('Перезагрузка роутера...', 'warning');
    updateUI();
    setTimeout(() => {
        state.router.rebooting = false;
        state.router.on = true;
        state.router.power = 100;
        state.router.speed = 100;
        const slider = document.getElementById('routerPowerSlider');
        if (slider) slider.value = 100;
        addNotification('Роутер перезагружен', 'info');
        updateUI();
    }, 3000);
}

function setRouterPower(value) {
    if (state.router.rebooting) {
        addNotification('Роутер перезагружается, подождите', 'warning');
        const slider = document.getElementById('routerPowerSlider');
        if (slider) slider.value = state.router.power;
        return;
    }
    state.router.power = parseInt(value);
    addNotification(`Мощность роутера: ${state.router.power}%`, 'info');
    updateUI();
}
