//-- script.js--

// code thêm begin
// 0. kết nối tới server backend đang chạy
const socket = io("http://localhost:3323");


// Phần 1. Cập nhật dữ liệu cảm biến
socket.on('connect', () => {
});

socket.on('mqtt-data', (data) => {
  document.getElementById('tempValue').textContent = `${data.temperature}°C`;
  document.getElementById('humidityValue').textContent = `${data.humidity}%`;
});

function login() {
  window.location.href = 'system-login.html';
}


//Phần 2. Điều khiển máy bơm
function Bat_May_Bom() {
  const button = document.getElementById('An_button');
  const status = document.getElementById('status_bom');

  //button.textContent = 'BẬT'; // Nút luôn hiển thị "BẬT"
  status.textContent = 'BẬT'; // Cập nhật trạng thái
  button.style.backgroundColor = '#45b9c6';
  socket.emit('relay-control', 'ON'); // Chỉ gửi lệnh ON
}

// Phần 3 DANH SACH CAY
let plantsData = [];
let selectedPlantIndex = null;
// 3.1 quản lý cây
function openPlantModal() {
  document.getElementById('plantManagement').style.display = 'block';
  document.getElementById('addPlantSection').style.display = 'block'; // Nếu muốn mở luôn phần thêm cây
  document.getElementById('editPlantSection').style.display = 'none';
}
function closePlantModal() {
  document.getElementById("plantManagement").style.display = "none";
}

// 3.2 Cập nhật danh sách cây
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
// 3.3 Lưu tên cây mới
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

// 3.4 Hàm quay lại màn hình danh sách cây
function cancelAddPlant() {
  document.getElementById('plantNameInputField').value = ''; // Xoá ô nhập tên cây
  selectedPlantIndex = null; // Bỏ chọn cây
  document.getElementById('addPlantSection').style.display = 'block'; // Đảm bảo form thêm cây vẫn hiện nếu cần
  document.getElementById('editPlantSection').style.display = 'none'; // Ẩn khung sửa
  document.getElementById('plantManagement').style.display = 'none'; // Quay về màn hình chính
}


// 3.5 Hàm mở phần chỉnh sửa cây
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

// 3.6 Hàm lưu tên cây đã chỉnh sửa
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

// 3.7 Xóa cây được chọn
function deleteSelectedPlant() {
  if (selectedPlantIndex !== null) {
    plantsData.splice(selectedPlantIndex, 1);
    selectedPlantIndex = null;
    document.getElementById('editPlantSection').style.display = 'none';
    document.getElementById('plantNameInputField').value = '';
    updatePlantList();
  }
}

// Phần 4 thời gian tưới cây
let cycleList = [];

function openCycleModal() {
  // Hiển thị modal để nhập chu kỳ
  document.getElementById("cycleModal").style.display = "block";
}

function closeCycleModal() {
  // Ẩn modal khi nhấn "Hủy"
  document.getElementById("cycleModal").style.display = "none";
}

// 4.1 lưu thời gian tưới cây
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
    socket.emit('set_wateringtime', cycleValue);
    console.log("Sent cycle value to backend:", cycleValue);
  } 
  else {
    alert("Vui lòng nhập một số nguyên dương (ví dụ: 3)!");
  }


  // Xóa dữ liệu trong input
  document.getElementById("cycleInput").value = "";
}

// 4.2 hiển thị thời gian tưới cây
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

// 4.3 xóa thời gian tưới cây
function deleteCycle(index) {
  // Xóa khỏi danh sách
  cycleList.splice(index, 1);
  updateCycleList();
}

// Phần 5 cập nhật thời gian

// 5.1 hàm lấy thời gian và hiển thị trên màn hình
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

// 5.2 Cập nhật mỗi giây
setInterval(updateTime, 1000);
updateTime(); // chạy lần đầu khi tải trang

// Phần 6 quản lý lịch tưới cây của user
let wateringSchedules = []; // Mảng lưu các lịch tưới cây

// 6.1 Khi trang web load, yêu cầu backend gửi lại lịch tưới từ database
window.addEventListener('load', () => {
  socket.emit('request_schedule_upload'); //Yêu cầu lịch từ backend
});

// 6.1.1 Lắng nghe dữ liệu từ backend qua sự kiện upload_schedule
socket.on("upload_schedule", function (scheduleList) {
  wateringSchedules = scheduleList.map((schedule) => ({
    day: getDayName(schedule.weekday).dayName, // tên "chủ nhật","thứ 2,.."
    dayIndex: schedule.weekday,// chỉ số 0,1,2.. <=> chủ nhật, thứ 2,..
    hour: schedule.hour,
    minute: schedule.minute,
    second: schedule.second,

    //biến dùng để sắp xếp thôi
    timestamp: new Date(2025, 0, 1, schedule.hour, schedule.minute, schedule.second).getTime(),
  }));

  // 6.1.2 Sắp xếp theo thứ tự: chủ nhật, thứ 2 -> thứ 7, sau đó theo giờ, phút, giây
  wateringSchedules.sort((a, b) => {
    if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex; // So sánh thứ tự ngày (thứ 2 đến Chủ Nhật)
    return a.timestamp - b.timestamp; // Nếu ngày giống nhau, so sánh theo giờ, phút, giây
  });

  // 6.1.3 tính giá trị order (vị trí của các lịch)
  wateringSchedules.forEach((schedule, index) => { 
    schedule.order = index;// luôn bắt đầu từ chỉ số 0
  });

  updateWateringScheduleList(); // ✅ Cập nhật UI
});

// 6.2 Chuyển đổi số thứ thành tên ngày và chỉ số
function getDayName(index) {
  const days = ["Chủ Nhật","Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
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

// 6.3 Thêm lịch mới từ user
document.getElementById("wateringScheduleForm").addEventListener("submit", function(e) {
  e.preventDefault();

  // 6.3.1 lấy dữ liệu người dùng
  const time = document.getElementById("wateringTime").value; // ví dụ 03:34 (giờ phút)
  const selectedDay = document.querySelector('input[name="day"]:checked')?.value; //(thứ)
  const secondsInput = document.getElementById("wateringSecond").value; // giây thứ

  // phải nhập đầy đủ thông tin
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

      // kiểm tra trùng lịch
      const isDuplicate = wateringSchedules.some(schedule =>
        schedule.dayIndex === dayIndex &&
        schedule.hour === parseInt(hours) &&
        schedule.minute === parseInt(minutes) &&
        schedule.second === seconds
      );

      if (isDuplicate) { // thông báo
        alert("Lịch tưới này đã tồn tại! Vui lòng chọn thời gian hoặc ngày khác.");
        return; // Dừng xử lý nếu lịch trùng
      }

      // ko trùng lịch thì tiếp tục
      const schedule = {
        day: getDayName(dayIndex).dayName, // Tên ngày (ví dụ: "Thứ 2")
        dayIndex: dayIndex,
        hour: parseInt(hours),
        minute: parseInt(minutes),
        second: seconds,

        // dùng để sắp xếp thời gian theo giờ (coi các chỉ số còn lại là bằng nhau)
        timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds).getTime()
      };

      // 6.3.2 Thêm và sắp xếp lịch
      wateringSchedules.push(schedule);
      wateringSchedules.sort((a, b) => {
        if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex; // ngày bằng thì sắp xếp theo giờ,phút,giây
        return a.timestamp - b.timestamp;
      });

      // Tính lại order cho tất cả lịch
      wateringSchedules.forEach((sched, index) => {
        sched.order = index;
      });

      // Lấy order của lịch mới
      const newScheduleOrder = wateringSchedules.indexOf(schedule);

      // cập nhật giao diện
      updateWateringScheduleList();
      cancelWateringSchedule(); // Đóng modal

      // 6.3.3 Gửi lịch mới đến backend
      socket.emit("add_schedule", {
        weekday: dayIndex,
        hour: parseInt(hours),
        minute: parseInt(minutes),
        second: seconds,
        order: newScheduleOrder
      });
    } 
    else {
      alert("Vui lòng chọn ngày hợp lệ.");
    }
  } 
  else {
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

// 6.4 Hiển thị danh sách lịch tưới cây với giờ AM/PM
function updateWateringScheduleList() {
  const scheduleListDiv = document.getElementById("scheduleList");
  scheduleListDiv.innerHTML = ""; // Xóa nội dung cũ

  // 6.4.1 Nếu không có lịch, hiển thị thông báo
  if (wateringSchedules.length === 0) {
    scheduleListDiv.innerHTML = "Chưa có lịch tưới cây."; 
  } 
  else {
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

//6.5 Chuyển đổi giờ sang định dạng 12 giờ (AM/PM)
function convertTo12HourFormat(hour) {
  const amPm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12; // Chuyển đổi giờ 24h sang 12h
  return { hour: hour12.toString().padStart(2, '0'), amPm };
}

// 6.7 Xóa lịch từ user
function deleteSchedule(index) {
  const schedule = wateringSchedules[index]; // Lấy lịch cần xóa
  wateringSchedules.splice(index, 1);
  wateringSchedules.forEach((schedule, i) => {
    schedule.order = i;
  });

  updateWateringScheduleList();

  // sau khi xóa thì gửi tới backend
  socket.emit("delete_schedule", {
    weekday: schedule.dayIndex,
    hour: schedule.hour,
    minute: schedule.minute,
    second: schedule.second,
    order: schedule.order 
  });
}

// Xem danh sách lịch
function openWateringScheduleListModal() {
  document.getElementById("wateringScheduleListModal").style.display = "block";
  updateWateringScheduleList(); // Cập nhật danh sách khi mở modal
}

function closeWateringScheduleListModal() {
  document.getElementById("wateringScheduleListModal").style.display = "none";
}

// Phần 7 ĐỘ CHỊU KHÁT của cây
function openWaterLimitModal() {
  document.getElementById("waterLimitModal").style.display = "block";
}

// 7.1 hàm lưu giá trị sau khi user nhập
function saveWaterLimit() {
  const waterLimitInput = document.getElementById("waterLimitInput").value;
  const waterLimitValue = parseInt(waterLimitInput);

  if (!isNaN(waterLimitValue) && waterLimitValue > 9) {
    document.getElementById("waterValue").textContent = `${waterLimitValue}đ`; // Cập nhật giá trị trên giao diện

    socket.emit("set_water_limit", waterLimitValue); // Gửi giá trị tới backend qua Socket.IO
    console.log("Sent water limit value to backend:", waterLimitValue);
    // Đóng modal
    document.getElementById("waterLimitModal").style.display = "none";
  } 
  else {
    alert("Vui lòng nhập một số nguyên dương lớn hơn 10!");
  }

  // Xóa ô nhập
  document.getElementById("waterLimitInput").value = "";
}


// 7.2 lấy giá trị ĐỘ CHỊU KHÁT từ esp8266
document.addEventListener("DOMContentLoaded", () => {
  socket.emit("request_water_limit"); // Gửi yêu cầu tới backend
});

// Lắng nghe giá trị từ backend
socket.on("get_water_limit", (waterLimitValue) => {
  if (waterLimitValue !== null && !isNaN(waterLimitValue)) {
    document.getElementById("waterValue").textContent = `${waterLimitValue}đ`; // Cập nhật giao diện
  } 
});


function toggleTooltip() {
  const tooltip = document.getElementById("tooltipText");
  tooltip.classList.toggle("show");
}


// 8 Mở modal từ điển tưới cây cây

// mở modal từ điển cây
function openDictionaryModal() { 
  document.getElementById('dictionaryModal').style.display = 'block';
}

// Hàm đóng modal từ điển tưới cây
function closeDictionaryModal() {
  document.getElementById('dictionaryModal').style.display = 'none';
}

// 8.1 Lắng nghe sự kiện nhập từ người dùng để tìm kiếm cây
document.getElementById('plantSearch').addEventListener('input', function () {
  const query = this.value;
  
  // Gửi sự kiện 'search' đến backend khi người dùng nhập vào ô tìm kiếm
  socket.emit('search', query);
});

// 8.2 Lắng nghe sự kiện 'plantsData' từ backend để hiển thị kết quả tìm kiếm
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
  } 
  else {
    suggestions.innerHTML = '<li>Không tìm thấy cây.</li>';
  }
});
