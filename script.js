//-- script.js.html--

// code thêm begin
// 1. kết nối tới server backend đang chạy
const socket = io("http://localhost:3323");


// 2. Cập nhật dữ liệu cảm biến
socket.on('connect', () => {
  console.log('Connected to backend');
});

socket.on('mqtt-data', (data) => {
  console.log('Received sensor data:', data);
  document.getElementById('tempValue').textContent = `${data.temperature}°C`;
  document.getElementById('humidityValue').textContent = `${data.humidity}%`;
});
/*
// 2. Hàm lấy dữ liệu cảm biến và cập nhật giao diện
async function fetchSensorData() {
  try {
    const response = await fetch(`${API_URL}/sensor/latest`);
    if (!response.ok) {
      throw new Error('No sensor data available');
    }
    const data = await response.json();
    // Cập nhật nhiệt độ và độ ẩm trên giao diện
    document.getElementById('tempValue').textContent = `${data.temperature}°C`;
    document.getElementById('humidityValue').textContent = `${data.humidity}%`;
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    document.getElementById('tempValue').textContent = '--°C';
    document.getElementById('humidityValue').textContent = '--%';
  }
}

// Gọi fetchSensorData khi tải trang main.html và tự động cập nhật mỗi 5 giây
function initSensorData() {
  if (document.getElementById('tempValue') && document.getElementById('humidityValue')) {
    fetchSensorData(); // Gọi lần đầu
    setInterval(fetchSensorData, 2000); // Cập nhật mỗi 2 giây
  }
}

// Gọi initSensorData khi trang tải
document.addEventListener('DOMContentLoaded', initSensorData);
// code thêm end*/

function login() {
// Chuyển sang trang đăng nhập hệ thống 
  window.location.href = 'system-login.html';
}

/*
// Nut tắt bật máy bơm
let isPumpOn = false;
function togglePump() {
  const button = document.getElementById("toggleButton");
  isPumpOn = !isPumpOn;
  if (isPumpOn) {
    button.textContent = "TẮT";
    button.style.backgroundColor = "#45b9c6"; 
  } else {
    button.textContent = "BẬT";
    button.style.backgroundColor = "#45b9c6";
  }
}
*/
// Điều khiển máy bơm
function togglePump() {
  const button = document.getElementById('toggleButton');
  const status = document.getElementById('pump-status');
  //button.textContent = 'BẬT'; // Nút luôn hiển thị "BẬT"
  status.textContent = 'BẬT'; // Cập nhật trạng thái
  button.style.backgroundColor = '#45b9c6';
  socket.emit('relay-control', 'ON'); // Chỉ gửi lệnh ON
  console.log('Sent relay state: ON');
}

// DANH SACH CAY
let plantsData = [];
let selectedPlantIndex = null;
// quản lý cây
function openPlantModal() {
  document.getElementById('plantManagement').style.display = 'block';
  document.getElementById('addPlantSection').style.display = 'block'; // Nếu muốn mở luôn phần thêm cây
  document.getElementById('editPlantSection').style.display = 'none';
}
function closePlantModal() {
  document.getElementById("plantManagement").style.display = "none";
}
// Cập nhật danh sách cây
function updatePlantList() {
  const plantList = document.getElementById('plantList');
  plantList.innerHTML = ''; // Xóa danh sách cũ

  plantsData.forEach((plant, index) => {
    const li = document.createElement('li');
    li.textContent = plant.name;
    li.onclick = () => {
      selectedPlantIndex = index;
      showEditPlantOptions(plant.name);
    };
    plantList.appendChild(li);
  });
}
// Lưu tên cây mới
function savePlantName() {
  const plantNameInput = document.getElementById('plantNameInputField');
  const name = plantNameInput.value.trim();

  if (name === '') {
    alert("Vui lòng nhập tên cây.");
    return;
  }
  plantsData.push({ name }); // Thêm cây mới vào danh sách
  plantNameInput.value = '';
  updatePlantList(); // Cập nhật giao diện danh sách
  showAddPlantSection() 
}
function showPlantList() {
  document.getElementById('plantManagement').style.display = 'block';
  document.getElementById('addPlantSection').style.display = 'none';
  document.getElementById('editPlantSection').style.display = 'none';
  updatePlantList(); 
  
}

// Hàm quay lại màn hình danh sách cây
function cancelAddPlant() {
  document.getElementById('plantNameInputField').value = ''; // Xoá ô nhập tên cây
  selectedPlantIndex = null; // Bỏ chọn cây
  document.getElementById('addPlantSection').style.display = 'block'; // Đảm bảo form thêm cây vẫn hiện nếu cần
  document.getElementById('editPlantSection').style.display = 'none'; // Ẩn khung sửa
  document.getElementById('plantManagement').style.display = 'none'; // Quay về màn hình chính
}


  // Hàm mở phần chỉnh sửa cây
  function showEditPlantOptions(plantName) {
    document.getElementById('editPlantSection').style.display = 'block';
    document.getElementById('selectedPlantName').textContent = "Cây đã chọn: " + plantName;
    document.getElementById('addPlantSection').style.display = 'none';
  
    let editButton = document.getElementById('editPlantButton');
    let editNameInput = document.querySelector('#editPlantSection input');

    // Nếu có ô chỉnh sửa cũ, xóa nó đi
    if (editButton) {
      editButton.remove();
    }

    if (editNameInput) {
      editNameInput.remove();
    }

    // Tạo ô nhập tên mới để chỉnh sửa
    const newNameInput = document.createElement('input');
    newNameInput.value = plantName;
    document.getElementById('editPlantSection').appendChild(newNameInput);

    // Tạo nút "Lưu chỉnh sửa"
    editButton = document.createElement('button');
    editButton.textContent = "Lưu chỉnh sửa";
    editButton.id = 'editPlantButton'; // Gán id để tránh tạo lại
    editButton.onclick = saveEditedPlant;
    document.getElementById('editPlantSection').appendChild(editButton);

  }

// Hàm lưu tên cây đã chỉnh sửa
function saveEditedPlant() {
  const newNameInput = document.querySelector('#editPlantSection input');
  const newName = newNameInput.value.trim();
  
  if (newName === '') {
    alert("Tên cây không thể để trống.");
    return;
  }

  // Cập nhật tên cây đã chọn
  plantsData[selectedPlantIndex].name = newName;
  updatePlantList();
  showPlantList() 
  // Xóa nút "Lưu chỉnh sửa" nếu đã lưu
  const editButton = document.getElementById('editPlantButton');
  if (editButton) {
    editButton.remove();
  }
}

// Xóa cây được chọn
function deleteSelectedPlant() {
  if (selectedPlantIndex !== null) {
    plantsData.splice(selectedPlantIndex, 1);
    selectedPlantIndex = null;
    document.getElementById('editPlantSection').style.display = 'none';
    document.getElementById('plantNameInputField').value = '';
    updatePlantList();
  }
}

///thời gian tưới cây
let cycleList = [];

function openCycleModal() {
  // Hiển thị modal để nhập chu kỳ
  document.getElementById("cycleModal").style.display = "block";
}

function closeCycleModal() {
  // Ẩn modal khi nhấn "Hủy"
  document.getElementById("cycleModal").style.display = "none";
}

function saveCycle() {
  // lấy thời gian tưới cây
  const cycleInput = document.getElementById("cycleInput").value;
  const cycleValue = parseInt(cycleInput);

  // Kiểm tra giá trị là số nguyên dương
  if (!isNaN(cycleValue) && cycleValue > 0) {
    cycleList.push(cycleValue); // Thêm giá trị vào danh sách
    updateCycleList(); // Cập nhật giao diện
    closeCycleModal(); // Đóng modal

    // Gửi giá trị thời gian tưới đến backend qua Socket.IO
    socket.emit("set_wateringtime", cycleValue);
    console.log("Sent cycle value to backend:", cycleValue);
  } else {
    alert("Vui lòng nhập một số nguyên dương (ví dụ: 5)!");
  }

  /*
  if (cycleInput) {
    // Thêm thời gian vào danh sách
    cycleList.push(cycleInput);
    updateCycleList();

    // Đóng modal
    closeCycleModal();
  } else {
    alert("Vui lòng nhập thời gian tưới cây!");
  }*/

  // Xóa dữ liệu trong input
  document.getElementById("cycleInput").value = "";
}

function updateCycleList() {
  const cycleListDiv = document.getElementById("cycleList");
  cycleListDiv.innerHTML = "";

  // Hiển thị danh sách thời gian tưới cây
  cycleList.forEach((cycle, index) => {
    const cycleDiv = document.createElement("div");
    cycleDiv.innerHTML = `
      <span>${cycle}</span>
      <button onclick="deleteCycle(${index})">x</button>
    `;
    cycleListDiv.appendChild(cycleDiv);
  });
}

function deleteCycle(index) {
  // Xóa chu kỳ khỏi danh sách
  cycleList.splice(index, 1);
  updateCycleList();
}


function updateTime() {
  const now = new Date();
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const dayOfWeek = days[now.getDay()];

  const timeString = `${dayOfWeek}, ${hours}:${minutes}:${seconds}`;
  document.getElementById("timeDisplay").innerText = timeString;
}

// Cập nhật mỗi giây
setInterval(updateTime, 1000);
updateTime(); // chạy lần đầu khi tải trang




let wateringSchedules = []; // Mảng lưu các lịch tưới cây

// ⬇️ Khi trang web load, yêu cầu backend gửi lại lịch tưới từ ESP8266
window.addEventListener('load', () => {
  socket.emit('request_schedule_upload'); // ✅ Yêu cầu lịch từ ESP8266
});

// ⬇️ Lắng nghe dữ liệu từ backend qua sự kiện upload_schedule
socket.on('upload_schedule', function(scheduleList) {
  wateringSchedules = scheduleList.map(([weekday, hour, minute, second, order]) => ({
    day: getDayName(weekday), // Chuyển đổi số thứ thành tên ngày
    hour,
    minute,
    second,
    order,
    timestamp: new Date(2025, 0, weekday, hour, minute, second).getTime() // Tạo timestamp cho mỗi lịch
  }));

  // Sắp xếp theo thứ tự: thứ 2 -> Chủ Nhật, sau đó theo giờ, phút, giây
  wateringSchedules.sort((a, b) => {
    if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex; // So sánh thứ tự ngày (thứ 2 đến Chủ Nhật)
    return a.timestamp - b.timestamp; // Nếu ngày giống nhau, so sánh theo giờ, phút, giây
  });

  updateWateringScheduleList(); // ✅ Cập nhật UI
});

// ⬇️ Chuyển đổi số thứ thành tên ngày và chỉ số
function getDayName(index) {
  const days = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
  return { dayName: days[index], dayIndex: index }; // Trả về cả tên ngày và chỉ số ngày
}

// Mở modal các tùy chọn
function openWateringScheduleOptions() {
  document.getElementById("wateringScheduleOptionsModal").style.display = "block";
}

function closeWateringScheduleOptionsModal() {
  document.getElementById("wateringScheduleOptionsModal").style.display = "none";
}

// Mở modal thêm lịch
function openAddWateringScheduleModal() {
  document.getElementById("wateringScheduleModal").style.display = "block";
  closeWateringScheduleOptionsModal();
}

function cancelWateringSchedule() {
  document.getElementById("wateringScheduleModal").style.display = "none"; // Đóng modal khi hủy
}

// Thêm lịch mới từ form
document.getElementById("wateringScheduleForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const time = document.getElementById("wateringTime").value;
  const selectedDay = document.querySelector('input[name="day"]:checked')?.value;
  const secondsInput = document.getElementById("wateringSecond").value;

  if (time && selectedDay && secondsInput !== "") {
    const [hours, minutes] = time.split(":");
    const seconds = parseInt(secondsInput);
    const now = new Date();

    // Bản đồ chỉ số ngày theo chuẩn JavaScript
    const daysMap = {
      "Sun": 0,
      "Mon": 1,
      "Tue": 2,
      "Wed": 3,
      "Thu": 4,
      "Fri": 5,
      "Sat": 6
    };

    const dayIndex = daysMap[selectedDay];

    if (dayIndex !== undefined) {
      const schedule = {
        day: getDayName(dayIndex).dayName, // Tên ngày (ví dụ: "Thứ 2")
        dayIndex: dayIndex,
        hour: parseInt(hours),
        minute: parseInt(minutes),
        second: seconds,
        timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds).getTime()
      };

      // Thêm và sắp xếp lịch
      wateringSchedules.push(schedule);
      wateringSchedules.sort((a, b) => {
        if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
        return a.timestamp - b.timestamp;
      });

      updateWateringScheduleList();
      cancelWateringSchedule(); // Đóng modal

      // Gửi lịch mới đến backend
      socket.emit("add_schedule", {
        weekday: dayIndex,
        hour: parseInt(hours),
        minute: parseInt(minutes),
        second: seconds
      });
    } else {
      alert("Vui lòng chọn ngày hợp lệ.");
    }
  } else {
    alert("Vui lòng nhập đầy đủ giờ, phút, giây và chọn ngày.");
  }
});

// Hàm trả về tên ngày (có thể tùy biến)
function getDayName(index) {
  const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  return {
    dayName: dayNames[index]
  };
}

// ⬇️ Hiển thị danh sách lịch tưới cây với giờ AM/PM
function updateWateringScheduleList() {
  const scheduleListDiv = document.getElementById("scheduleList");
  scheduleListDiv.innerHTML = ""; // Xóa nội dung cũ

  if (wateringSchedules.length === 0) {
    scheduleListDiv.innerHTML = "Chưa có lịch tưới cây."; // Nếu không có lịch, hiển thị thông báo
  } else {
    wateringSchedules.forEach((schedule, index) => {
      const scheduleDiv = document.createElement("div");

      const hour = convertTo12HourFormat(schedule.hour); // Chuyển đổi giờ sang định dạng AM/PM
      const minute = schedule.minute.toString().padStart(2, '0');
      const second = (schedule.second || 0).toString().padStart(2, '0');
      const amPm = hour.amPm;

      scheduleDiv.innerHTML = `
        ${index + 1} | ${schedule.day} ${hour.hour}:${minute}:${second} ${amPm}
        <button onclick="deleteSchedule(${index})">🗑️ Xóa</button>
      `;

      scheduleListDiv.appendChild(scheduleDiv); // Thêm vào UI
    });
  }
}

// ⬇️ Chuyển đổi giờ sang định dạng 12 giờ (AM/PM)
function convertTo12HourFormat(hour) {
  const amPm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12; // Chuyển đổi giờ 24h sang 12h
  return { hour: hour12.toString().padStart(2, '0'), amPm };
}

// ⬇️ Xóa lịch
function deleteSchedule(index) {
  wateringSchedules.splice(index, 1); // Xóa lịch khỏi mảng
  updateWateringScheduleList(); // Cập nhật lại UI
}

// ⬇️ Xem danh sách lịch
function openWateringScheduleListModal() {
  document.getElementById("wateringScheduleListModal").style.display = "block";
  updateWateringScheduleList(); // Cập nhật danh sách khi mở modal
}

function closeWateringScheduleListModal() {
  document.getElementById("wateringScheduleListModal").style.display = "none";
}

// ĐIỂM TỚI HẠN
function openWaterLimitModal() {
  document.getElementById("waterLimitModal").style.display = "block";
}

function saveWaterLimit() {
  const waterLimitInput = document.getElementById("waterLimitInput").value;
  const waterLimitValue = parseInt(waterLimitInput);

  if (!isNaN(waterLimitValue) && waterLimitValue > 9) {
    // Cập nhật giá trị trên giao diện
    document.getElementById("waterValue").textContent = `${waterLimitValue}đ`;
    // Gửi giá trị tới backend qua Socket.IO
    socket.emit("set_water_limit", waterLimitValue);
    console.log("Sent water limit value to backend:", waterLimitValue);
    // Đóng modal
    document.getElementById("waterLimitModal").style.display = "none";
  } else {
    alert("Vui lòng nhập một số nguyên dương lớn hơn 10!");
  }

  // Xóa ô nhập
  document.getElementById("waterLimitInput").value = "";
}


function toggleTooltip() {
  const tooltip = document.getElementById("tooltipText");
  tooltip.classList.toggle("show");
}


// Mở modal từ điển cây
function openDictionaryModal() {
  document.getElementById('dictionaryModal').style.display = 'block';
}

// Hàm đóng modal từ điển cây
function closeDictionaryModal() {
  document.getElementById('dictionaryModal').style.display = 'none';
}

// Lắng nghe sự kiện nhập liệu từ người dùng để tìm kiếm cây
document.getElementById('plantSearch').addEventListener('input', function () {
  const query = this.value;
  
  // Gửi sự kiện 'search' đến backend khi người dùng nhập vào ô tìm kiếm
  socket.emit('search', query);
});

// Lắng nghe sự kiện 'plantsData' từ backend để hiển thị kết quả tìm kiếm
socket.on('plantsData', (plants) => {
  const suggestions = document.getElementById('suggestions');
  const plantInfo = document.getElementById('plantInfo');

  // Làm sạch các gợi ý và thông tin cây trước
  suggestions.innerHTML = '';
  plantInfo.innerHTML = '';

  if (plants.length > 0) {
    plants.forEach(plant => {
      const li = document.createElement('li');
      li.textContent = plant.name;
      li.onclick = function () {
        // Hiển thị thông tin cây khi nhấp vào tên cây
        plantInfo.innerHTML = `<strong>${plant.name}</strong>: ${plant.info}`;
        suggestions.innerHTML = ''; // Xóa gợi ý sau khi chọn cây
      };
      suggestions.appendChild(li);
    });
  } else {
    suggestions.innerHTML = '<li>Không tìm thấy cây.</li>';
  }
});
