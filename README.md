# Aquarium New Tab — Motion Update

Bản này giữ lại nền tảng Giai đoạn 1 và tích hợp chuyển động cá Giai đoạn 2 đã tinh chỉnh.

## Cấu trúc

- `newtab/app.js`: khởi tạo Aquarium, kết nối PixiJS Ticker bằng `ticker.deltaTime`, giữ tìm kiếm / Settings / Page Visibility.
- `engine/aquarium.js`: quản lý đàn cá và cập nhật theo hai lượt (tính lực trước, cập nhật vị trí sau).
- `engine/vector2.js`: phép toán vector, có `magSq`, `distSq`, `set` và `limit`.
- `behaviors/boids.js`: Separation, Alignment, Cohesion, Wander steering, Boundary gradient và direction bias.
- `entities/fish.js`: Graphics PixiJS 8, rotation smoothing, cá thể hóa thông số, drift hướng ưa thích và speed modulation.
- `engine/renderer.js`: giữ cấu hình Renderer đang chạy; đặc biệt giữ `pixi.js/unsafe-eval` để dùng polyfill tương thích CSP của extension.

## Cài đặt

1. Giải nén và chép đè các thư mục/tệp trong bản này lên dự án hiện tại, hoặc dùng nguyên thư mục sau khi giải nén.
2. Chạy:
   ```bash
   npm install
   npm run build
   ```
3. Mở `chrome://extensions`, bật Developer mode, chọn **Load unpacked** và trỏ tới thư mục `dist`.

## Những quyết định chuyển động đã tích hợp

- Rotation smoothing dùng góc ngắn nhất và exponential smoothing theo `deltaTime`.
- Wander dùng random walk nhẹ, sau đó steering tới một điểm mục tiêu phía trước cá.
- Boundary avoidance dùng gradient theo khoảng cách; không normalize rồi làm mất magnitude.
- Giảm Boundary weight từ 3.0 xuống 1.5.
- Tổng acceleration được giới hạn ở `fish.maxForce * 2`.
- Tốc độ khởi tạo không gần 0; thông số và trọng số Boids khác nhau theo từng cá.
- Direction bias nhỏ, hướng ưa thích chuyển dần sang mục tiêu mới theo thời gian.
- Speed modulation dựa trên góc thực sự đã xoay, không dùng target error làm angular velocity.
- `deltaTime` chỉ được nhân vào quá trình tích phân vận tốc/vị trí và các trạng thái theo thời gian; không nhân hai lần vào steering force.

## Cố ý chưa đưa vào

- Perception delay / Neighbor Cache: chờ quan sát xem variation đã đủ phá đồng pha chưa.
- Spatial Grid: hiện tại đàn mặc định 30 cá, vòng lặp O(N²) vẫn phù hợp để kiểm tra hành vi. Bổ sung khi tăng số cá.
- State Machine: để giai đoạn có thức ăn, nguy hiểm và tương tác môi trường.
- Fixed timestep: chưa cần ở giai đoạn này; mô phỏng đang dùng `ticker.deltaTime` và clamp lag spike.

## Ghi chú kiểm thử

`Math.random()` vẫn được dùng cho cá thể hóa và Wander. Vì vậy các lần chạy không tái lập giống hệt nhau. Muốn kiểm thử A/B bằng cùng seed, cần bổ sung PRNG có seed và thay mọi điểm gọi `Math.random()` trong hệ sinh thái.


## Quy trình nghiệm thu chuyển động đề xuất

1. Chạy 1 cá để kiểm tra Wander và Boundary.
2. Chạy 10–30 cá để kiểm tra Separation, Alignment và Cohesion.
3. Chạy 50 cá trong 30 giây; bỏ qua 5 giây đầu để hệ thống ổn định.
4. Thử cùng một cấu hình trên màn hình 60/120/144 Hz nếu có thể.
5. Ghi lại:
   - Tốc độ trung bình và độ lệch chuẩn theo từng cá (CV = std / mean).
   - Khoảng cách từng cá tới trọng tâm đàn.
   - Vùng màn hình từng cá đi qua (occupancy).
   - Độ tương đồng hướng di chuyển giữa các cá lân cận.
6. Dùng CV ≥ 0.2 như một dấu hiệu tham khảo, không phải điều kiện đạt/trượt tuyệt đối. Thông số `maxSpeed` hiện đã được lấy mẫu trong khoảng 1.5–3.0 nên CV lý thuyết ban đầu đã xấp xỉ 0.192 trước khi tính các hiệu ứng khác.

Hiện dự án chưa dùng PRNG có seed. Do đó, các lần chạy không thể tái lập chính xác chỉ bằng cách lặp lại cùng số lượng cá.
