let state = {
    thunder: false,
    motion: true,
    lightSensor: 'day',
    autoThunder: false,
    autoNoOne: false,
    autoEnergySave: false,
    selectedRoom: null,
    
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
        timer: null,
        startTime: null
    },
    
    router: {
        power: 100,
        rebooting: false,
        on: true,
        speed: 100,
        load: 0,
        interval: null
    },
    
    smartPlug: {
        on: false,
        power: 0,
        interval: null
    }
};

let absenceTimer = null;
let currentRoomFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
    updateUI();
    startRouterSimulation();
    startPlugSimulation();
    initFloorplan();
    initRoomFilters();
    updateAllButtons();
    
    let programBtns = document.querySelectorAll('.program-btn');
    for (let i = 0; i < programBtns.length; i++) {
        let btn = programBtns[i];
        btn.classList.remove('active');
        if (btn.dataset.program === state.washer.program) {
            btn.classList.add('active');
        }
    }
    
    addNotification('Система Flo.House запущена', 'info');
});

function manualThunderScenario() {
    addNotification('РУЧНОЙ ЗАПУСК: Сценарий "Гроза"', 'error');
    executeThunderScenario();
}

function manualNoOneScenario() {
    addNotification('РУЧНОЙ ЗАПУСК: Сценарий "Никого нет"', 'warning');
    executeNoOneScenario();
}

function manualEnergySaveScenario() {
    addNotification('РУЧНОЙ ЗАПУСК: Сценарий "Энергосбережение"', 'warning');
    executeEnergySaveScenario();
}

function initFloorplan() {
    let rooms = document.querySelectorAll('.room');
    for (let i = 0; i < rooms.length; i++) {
        rooms[i].addEventListener('click', function(e) {
            e.stopPropagation();
            let roomId = this.dataset.room;
            let roomName = this.dataset.roomName;
            selectRoom(roomId, roomName);
        });
    }
}

function selectRoom(roomId, roomName) {
    let rooms = document.querySelectorAll('.room');
    for (let i = 0; i < rooms.length; i++) {
        rooms[i].classList.remove('selected');
    }
    
    let selectedElement = document.getElementById('room-' + roomId);
    if (selectedElement) {
        selectedElement.classList.add('selected');
    }
    
    state.selectedRoom = roomId;
    
    let infoDiv = document.getElementById('selectedRoomInfo');
    let lightStatus = 'выключен';
    let brightness = 0;
    if (state.lights[roomId]) {
        lightStatus = state.lights[roomId].on ? 'включен' : 'выключен';
        brightness = state.lights[roomId].brightness;
    }
    
    infoDiv.innerHTML = 'Выбрана комната: <strong>' + roomName + '</strong> | Свет: ' + lightStatus + (brightness > 0 ? ' (' + brightness + '%)' : '');
    
    addNotification('Выбрана комната: ' + roomName, 'info');
    
    if (roomId !== 'hall' && roomId !== 'bathroom' && roomId !== 'balcony') {
        filterDevicesByRoomId(roomId);
    }
}

function filterDevicesByRoomId(roomId) {
    let devices = document.querySelectorAll('.device-card');
    for (let i = 0; i < devices.length; i++) {
        let device = devices[i];
        let deviceRoom = device.dataset.room;
        if (deviceRoom === roomId) {
            device.style.display = 'block';
            device.style.borderColor = '#555';
        } else if (currentRoomFilter === 'all') {
            device.style.display = 'block';
            device.style.borderColor = '#2a2a2a';
        } else {
            device.style.display = 'none';
        }
    }
}

function initRoomFilters() {
    let filterBtns = document.querySelectorAll('.filter-btn');
    for (let i = 0; i < filterBtns.length; i++) {
        filterBtns[i].addEventListener('click', function() {
            for (let j = 0; j < filterBtns.length; j++) {
                filterBtns[j].classList.remove('active');
            }
            this.classList.add('active');
            currentRoomFilter = this.dataset.filter;
            filterDevicesByRoom();
        });
    }
}

function filterDevicesByRoom() {
    let devices = document.querySelectorAll('.device-card');
    for (let i = 0; i < devices.length; i++) {
        let device = devices[i];
        let deviceRoom = device.dataset.room;
        if (currentRoomFilter === 'all' || deviceRoom === currentRoomFilter) {
            device.style.display = 'block';
        } else {
            device.style.display = 'none';
        }
    }
}

function toggleThunder() {
    if (state.thunder) {
        state.thunder = false;
        addNotification('Гроза закончилась', 'info');
        updateUI();
        updateAllButtons();
    } else {
        state.thunder = true;
        addNotification('Гроза началась!', 'error');
        executeThunderScenario();
        updateUI();
        updateAllButtons();
    }
}

function clearThunder() {
    if (state.thunder) {
        state.thunder = false;
        addNotification('Гроза закончилась', 'info');
        updateUI();
        updateAllButtons();
    }
}

function setMotion(hasMotion) {
    state.motion = hasMotion;
    addNotification(hasMotion ? 'Движение есть' : 'Движения нет', 'info');
    updateUI();
    updateAllButtons();
    
    if (!hasMotion && state.autoNoOne) {
        if (absenceTimer) clearTimeout(absenceTimer);
        absenceTimer = setTimeout(function() {
            if (!state.motion && state.autoNoOne) {
                executeNoOneScenario();
            }
        }, 5000);
    } else if (hasMotion && absenceTimer) {
        clearTimeout(absenceTimer);
        absenceTimer = null;
    }
}

function setLightSensor(value) {
    state.lightSensor = value;
    let statusEl = document.getElementById('lightSensorStatus');
    if (statusEl) {
        statusEl.textContent = value === 'day' ? 'День' : 'Ночь';
    }
    addNotification(value === 'day' ? 'Датчик: день' : 'Датчик: ночь', 'info');
    updateAllButtons();
    
    if (value === 'night' && state.autoEnergySave) {
        executeEnergySaveScenario();
    }
}

function toggleAutoThunder(checked) {
    state.autoThunder = checked;
    addNotification(checked ? 'Автосценарий "Гроза" включен' : 'Автосценарий "Гроза" выключен', 'info');
}

function toggleAutoNoOne(checked) {
    state.autoNoOne = checked;
    addNotification(checked ? 'Автосценарий "Никого нет" включен' : 'Автосценарий "Никого нет" выключен', 'info');
}

function toggleAutoEnergySave(checked) {
    state.autoEnergySave = checked;
    addNotification(checked ? 'Автосценарий "Энергосбережение" включен' : 'Автосценарий "Энергосбережение" выключен', 'info');
    if (checked && state.lightSensor === 'night') {
        executeEnergySaveScenario();
    }
}

function executeThunderScenario() {
    addNotification('СЦЕНАРИЙ "ГРОЗА" - ВСЁ ОТКЛЮЧАЕТСЯ', 'error');
    
    state.lights.kitchen.on = false;
    state.lights.kitchen.brightness = 0;
    state.lights.living.on = false;
    state.lights.living.brightness = 0;
    state.lights.bedroom.on = false;
    state.lights.bedroom.brightness = 0;
    addNotification('Весь свет выключен', 'error');
    
    if (state.washer.timer) {
        clearTimeout(state.washer.timer);
        state.washer.timer = null;
    }
    state.washer.status = 'stopped';
    addNotification('Стиральная машина остановлена', 'error');
    
    state.router.on = false;
    state.router.speed = 0;
    addNotification('Роутер выключен', 'error');
    
    state.smartPlug.on = false;
    state.smartPlug.power = 0;
    addNotification('Умная розетка выключена', 'error');
    
    updateUI();
    updateAllButtons();
}

function executeNoOneScenario() {
    addNotification('СЦЕНАРИЙ "НИКОГО НЕТ" - ВЫКЛЮЧАЕМ СВЕТ', 'warning');
    
    state.lights.kitchen.on = false;
    state.lights.kitchen.brightness = 0;
    state.lights.living.on = false;
    state.lights.living.brightness = 0;
    state.lights.bedroom.on = false;
    state.lights.bedroom.brightness = 0;
    addNotification('Весь свет выключен (никого нет)', 'warning');
    
    if (state.smartPlug.on) {
        state.smartPlug.on = false;
        state.smartPlug.power = 0;
        addNotification('Умная розетка выключена', 'warning');
    }
    
    updateUI();
    updateAllButtons();
}

function executeEnergySaveScenario() {
    addNotification('СЦЕНАРИЙ "ЭНЕРГОСБЕРЕЖЕНИЕ" АКТИВИРОВАН', 'warning');
    
    if (state.lights.kitchen.on) {
        state.lights.kitchen.brightness = 20;
        addNotification('Кухня: яркость 20%', 'info');
    }
    if (state.lights.living.on) {
        state.lights.living.brightness = 20;
        addNotification('Гостиная: яркость 20%', 'info');
    }
    if (state.lights.bedroom.on) {
        state.lights.bedroom.brightness = 20;
        addNotification('Спальня: яркость 20%', 'info');
    }
    
    if (state.washer.status === 'stopped') {
        state.washer.program = 'quick';
        state.washer.time = 30;
        state.washer.temperature = 30;
        
        let programBtns = document.querySelectorAll('.program-btn');
        for (let i = 0; i < programBtns.length; i++) {
            programBtns[i].classList.remove('active');
            if (programBtns[i].dataset.program === 'quick') {
                programBtns[i].classList.add('active');
            }
        }
        
        let timeSelect = document.getElementById('washerTime');
        if (timeSelect) timeSelect.value = '30';
        let tempSelect = document.getElementById('washerTemp');
        if (tempSelect) tempSelect.value = '30';
        
        addNotification('Стиральная машина: экономный режим', 'info');
    }
    
    if (state.router.on) {
        state.router.power = 30;
        let slider = document.getElementById('routerPowerSlider');
        if (slider) slider.value = 30;
        addNotification('Роутер: мощность 30%', 'info');
    }
    
    if (state.smartPlug.on) {
        state.smartPlug.on = false;
        state.smartPlug.power = 0;
        addNotification('Умная розетка выключена', 'warning');
    }
    
    updateUI();
    updateAllButtons();
}

function turnLightOn(room) {
    if (!state.lights[room].on) {
        if (state.lights[room].brightness === 0) {
            state.lights[room].brightness = 70;
        }
        state.lights[room].on = true;
        addNotification('Свет в ' + room + ' включен', 'info');
        updateUI();
        updateAllButtons();
    }
}

function turnLightOff(room) {
    if (state.lights[room].on) {
        state.lights[room].on = false;
        addNotification('Свет в ' + room + ' выключен', 'info');
        updateUI();
        updateAllButtons();
    }
}

function setBrightness(room, value) {
    let brightness = parseInt(value);
    state.lights[room].brightness = brightness;
    if (brightness === 0) {
        state.lights[room].on = false;
    } else if (brightness > 0 && !state.lights[room].on) {
        state.lights[room].on = true;
    }
    let brightnessSpan = document.getElementById(room + 'BrightnessValue');
    if (brightnessSpan) brightnessSpan.textContent = brightness + '%';
    updateUI();
}

function updateWasherProgram(program) {
    state.washer.program = program;
    let btns = document.querySelectorAll('.program-btn');
    for (let i = 0; i < btns.length; i++) {
        btns[i].classList.remove('active');
        if (btns[i].dataset.program === program) {
            btns[i].classList.add('active');
        }
    }
    let names = { 'cotton': 'Хлопок', 'delicate': 'Деликатная', 'synthetic': 'Синтетика', 'quick': 'Быстрая' };
    addNotification('Выбрана программа: ' + (names[program] || program), 'info');
}

function updateWasherTime(time) {
    state.washer.time = parseInt(time);
    addNotification('Время стирки: ' + time + ' мин', 'info');
}

function updateWasherTemp(temp) {
    state.washer.temperature = parseInt(temp);
    addNotification('Температура: ' + temp + 'C', 'info');
}

function calculateWaterUsage() {
    let perMin = 1.2;
    if (state.washer.program === 'cotton') perMin = 1.5;
    if (state.washer.program === 'quick') perMin = 0.8;
    if (state.washer.program === 'delicate') perMin = 1.0;
    return Math.round(state.washer.time * perMin);
}

function washerStart() {
    if (state.washer.status === 'running') {
        addNotification('Стиральная машина уже работает', 'warning');
        return;
    }
    if (state.washer.timer) clearTimeout(state.washer.timer);
    state.washer.waterUsed = calculateWaterUsage();
    state.washer.status = 'running';
    state.washer.startTime = Date.now();
    addNotification('СТИРКА НАЧАТА! Время: ' + state.washer.time + ' мин', 'info');
    
    state.washer.timer = setTimeout(function() {
        if (state.washer.status === 'running') {
            state.washer.status = 'stopped';
            addNotification('СТИРКА ЗАВЕРШЕНА! Расход воды: ' + state.washer.waterUsed + ' л', 'info');
            updateUI();
            updateAllButtons();
        }
    }, state.washer.time * 1000);
    updateUI();
    updateAllButtons();
}

function washerPause() {
    if (state.washer.status === 'running') {
        if (state.washer.timer) clearTimeout(state.washer.timer);
        state.washer.status = 'paused';
        addNotification('Стиральная машина на паузе', 'warning');
    } else if (state.washer.status === 'paused') {
        let remainingTime = state.washer.time - ((Date.now() - state.washer.startTime) / 1000);
        if (remainingTime > 0) {
            state.washer.status = 'running';
            state.washer.timer = setTimeout(function() {
                if (state.washer.status === 'running') {
                    state.washer.status = 'stopped';
                    addNotification('СТИРКА ЗАВЕРШЕНА! Расход воды: ' + state.washer.waterUsed + ' л', 'info');
                    updateUI();
                    updateAllButtons();
                }
            }, remainingTime * 1000);
            addNotification('Стирка возобновлена', 'info');
        }
    } else {
        addNotification('Стиральная машина не работает', 'warning');
        return;
    }
    updateUI();
    updateAllButtons();
}

function washerStop() {
    if (state.washer.status === 'stopped') {
        addNotification('Стиральная машина уже остановлена', 'warning');
        return;
    }
    if (state.washer.timer) clearTimeout(state.washer.timer);
    state.washer.status = 'stopped';
    addNotification('Стиральная машина остановлена', 'warning');
    updateUI();
    updateAllButtons();
}

function startRouterSimulation() {
    if (state.router.interval) clearInterval(state.router.interval);
    state.router.interval = setInterval(function() {
        if (state.router.on && !state.router.rebooting) {
            let variation = (Math.random() - 0.5) * 30;
            let newSpeed = Math.max(10, Math.min(100, Math.round(state.router.speed + variation)));
            state.router.speed = newSpeed;
            state.router.load = Math.floor(Math.random() * 100);
            
            let speedElement = document.getElementById('routerSpeedValue');
            let loadElement = document.getElementById('routerLoadValue');
            if (speedElement) speedElement.textContent = state.router.speed + ' Мбит/с';
            if (loadElement) loadElement.textContent = state.router.load + '%';
        } else if (!state.router.on) {
            let speedElement = document.getElementById('routerSpeedValue');
            let loadElement = document.getElementById('routerLoadValue');
            if (speedElement) speedElement.textContent = '0 Мбит/с';
            if (loadElement) loadElement.textContent = '0%';
        }
    }, 2000);
}

function routerOn() {
    if (!state.router.on) {
        state.router.on = true;
        addNotification('Роутер включен', 'info');
        updateUI();
        updateAllButtons();
    }
}

function routerOff() {
    if (state.router.on) {
        state.router.on = false;
        state.router.speed = 0;
        addNotification('Роутер выключен', 'info');
        updateUI();
        updateAllButtons();
    }
}

function routerReboot() {
    if (state.router.rebooting) {
        addNotification('Роутер уже перезагружается', 'warning');
        return;
    }
    state.router.rebooting = true;
    addNotification('Перезагрузка роутера...', 'info');
    updateUI();
    updateAllButtons();
    setTimeout(function() {
        state.router.rebooting = false;
        state.router.on = true;
        state.router.power = 100;
        state.router.speed = 100;
        let slider = document.getElementById('routerPowerSlider');
        if (slider) slider.value = 100;
        addNotification('Роутер перезагружен', 'info');
        updateUI();
        updateAllButtons();
    }, 3000);
}

function setRouterPower(value) {
    if (state.router.rebooting) {
        addNotification('Роутер перезагружается, подождите', 'warning');
        let slider = document.getElementById('routerPowerSlider');
        if (slider) slider.value = state.router.power;
        return;
    }
    state.router.power = parseInt(value);
    addNotification('Мощность роутера: ' + state.router.power + '%', 'info');
    updateUI();
}

function startPlugSimulation() {
    if (state.smartPlug.interval) clearInterval(state.smartPlug.interval);
    state.smartPlug.interval = setInterval(function() {
        if (state.smartPlug.on) {
            let power = Math.floor(Math.random() * 150) + 50;
            state.smartPlug.power = power;
            let powerSpan = document.getElementById('plugPower');
            if (powerSpan) powerSpan.textContent = power;
        } else {
            state.smartPlug.power = 0;
            let powerSpan = document.getElementById('plugPower');
            if (powerSpan) powerSpan.textContent = 0;
        }
    }, 2000);
}

function plugOn() {
    if (!state.smartPlug.on) {
        state.smartPlug.on = true;
        addNotification('Умная розетка включена', 'info');
        updateUI();
        updateAllButtons();
    }
}

function plugOff() {
    if (state.smartPlug.on) {
        state.smartPlug.on = false;
        state.smartPlug.power = 0;
        addNotification('Умная розетка выключена', 'info');
        updateUI();
        updateAllButtons();
    }
}

function updateUI() {
    let thunderStatus = document.getElementById('thunderStatus');
    if (thunderStatus) {
        thunderStatus.textContent = state.thunder ? 'Активен' : 'Выключен';
        thunderStatus.className = 'sensor-status ' + (state.thunder ? 'active' : '');
    }
    
    let motionStatus = document.getElementById('motionStatus');
    if (motionStatus) {
        motionStatus.textContent = state.motion ? 'Есть движение' : 'Нет движения';
    }
    
    let lightSensorStatus = document.getElementById('lightSensorStatus');
    if (lightSensorStatus) {
        lightSensorStatus.textContent = state.lightSensor === 'day' ? 'День' : 'Ночь';
    }
    
    let rooms = ['kitchen', 'living', 'bedroom'];
    for (let i = 0; i < rooms.length; i++) {
        let room = rooms[i];
        let lightStatus = document.getElementById(room + 'LightStatus');
        let brightnessValue = document.getElementById(room + 'BrightnessValue');
        let slider = document.getElementById(room + 'Brightness');
        
        if (lightStatus) {
            lightStatus.textContent = state.lights[room].on ? 'Вкл' : 'Выкл';
            lightStatus.className = 'light-status ' + (state.lights[room].on ? 'on' : '');
        }
        if (brightnessValue) brightnessValue.textContent = state.lights[room].brightness + '%';
        if (slider) slider.value = state.lights[room].brightness;
    }
    
    let washerStatus = document.getElementById('washerStatus');
    let statusText = {
        stopped: 'Остановлена',
        running: 'Стирка...',
        paused: 'На паузе'
    };
    if (washerStatus) {
        washerStatus.textContent = statusText[state.washer.status];
        washerStatus.className = 'washer-status ' + state.washer.status;
    }
    
    let waterUsedSpan = document.getElementById('washerWaterUsed');
    if (waterUsedSpan) waterUsedSpan.textContent = state.washer.waterUsed;
    
    let routerPowerSpan = document.getElementById('routerPower');
    if (routerPowerSpan) routerPowerSpan.textContent = state.router.power + '%';
    
    let routerPowerSlider = document.getElementById('routerPowerSlider');
    if (routerPowerSlider) routerPowerSlider.value = state.router.power;
    
    let routerStatusText = document.getElementById('routerStatusText');
    if (routerStatusText) {
        routerStatusText.textContent = state.router.rebooting ? 'Перезагрузка...' : (state.router.on ? 'Работает' : 'Выключен');
    }
    
    let plugStatus = document.getElementById('plugStatus');
    if (plugStatus) {
        plugStatus.textContent = state.smartPlug.on ? 'Включена' : 'Выключена';
        plugStatus.className = 'plug-status ' + (state.smartPlug.on ? 'on' : 'off');
    }
    
    let plugPower = document.getElementById('plugPower');
    if (plugPower) plugPower.textContent = state.smartPlug.power;
}

function updateAllButtons() {
    let thunderOnBtn = document.getElementById('thunderOnBtn');
    let thunderOffBtn = document.getElementById('thunderOffBtn');
    if (thunderOnBtn && thunderOffBtn) {
        if (state.thunder) {
            thunderOnBtn.classList.add('active');
            thunderOffBtn.classList.remove('active');
        } else {
            thunderOnBtn.classList.remove('active');
            thunderOffBtn.classList.add('active');
        }
    }
    
    let motionOnBtn = document.getElementById('motionOnBtn');
    let motionOffBtn = document.getElementById('motionOffBtn');
    if (motionOnBtn && motionOffBtn) {
        if (state.motion) {
            motionOnBtn.classList.add('active');
            motionOffBtn.classList.remove('active');
        } else {
            motionOnBtn.classList.remove('active');
            motionOffBtn.classList.add('active');
        }
    }
    
    let dayBtn = document.getElementById('lightSensorDayBtn');
    let nightBtn = document.getElementById('lightSensorNightBtn');
    if (dayBtn && nightBtn) {
        if (state.lightSensor === 'day') {
            dayBtn.classList.add('active');
            nightBtn.classList.remove('active');
        } else {
            dayBtn.classList.remove('active');
            nightBtn.classList.add('active');
        }
    }
    
    let rooms = ['kitchen', 'living', 'bedroom'];
    for (let i = 0; i < rooms.length; i++) {
        let room = rooms[i];
        let onBtn = document.getElementById(room + 'LightOnBtn');
        let offBtn = document.getElementById(room + 'LightOffBtn');
        if (onBtn && offBtn) {
            if (state.lights[room].on) {
                onBtn.classList.add('active');
                offBtn.classList.remove('active');
            } else {
                onBtn.classList.remove('active');
                offBtn.classList.add('active');
            }
        }
    }
    
    let startBtn = document.getElementById('washerStartBtn');
    let pauseBtn = document.getElementById('washerPauseBtn');
    let stopBtn = document.getElementById('washerStopBtn');
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
    
    let routerOnBtn = document.getElementById('routerOnBtn');
    let routerOffBtn = document.getElementById('routerOffBtn');
    let routerRebootBtn = document.getElementById('routerRebootBtn');
    if (routerOnBtn && routerOffBtn && routerRebootBtn) {
        routerOnBtn.classList.remove('active');
        routerOffBtn.classList.remove('active');
        routerRebootBtn.classList.remove('active');
        
        if (state.router.rebooting) {
            routerRebootBtn.classList.add('active');
        } else if (state.router.on) {
            routerOnBtn.classList.add('active');
        } else {
            routerOffBtn.classList.add('active');
        }
    }
    
    let plugOnBtn = document.getElementById('plugOnBtn');
    let plugOffBtn = document.getElementById('plugOffBtn');
    if (plugOnBtn && plugOffBtn) {
        if (state.smartPlug.on) {
            plugOnBtn.classList.add('active');
            plugOffBtn.classList.remove('active');
        } else {
            plugOnBtn.classList.remove('active');
            plugOffBtn.classList.add('active');
        }
    }
}

function addNotification(message, type) {
    if (type === undefined) type = 'info';
    let list = document.getElementById('notificationsList');
    if (!list) return;
    
    let notification = document.createElement('div');
    notification.className = 'notification ' + type;
    let now = new Date();
    let timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                  now.getMinutes().toString().padStart(2, '0') + ':' + 
                  now.getSeconds().toString().padStart(2, '0');
    notification.innerHTML = '[' + timeStr + '] ' + message;
    
    list.insertBefore(notification, list.firstChild);
    
    while (list.children.length > 15) {
        list.removeChild(list.lastChild);
    }
    
    setTimeout(function() {
        if (notification.parentNode) notification.remove();
    }, 6000);
}

function clearNotifications() {
    let list = document.getElementById('notificationsList');
    if (list) list.innerHTML = '';
    addNotification('Все уведомления очищены', 'info');
}
