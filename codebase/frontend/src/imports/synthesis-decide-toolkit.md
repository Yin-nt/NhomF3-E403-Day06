# Toolkit - Từ Evidence Đến Build Slice

Dùng sau khi nhóm đã có evidence. Mục tiêu là chốt một build slice đủ nhỏ cho Day 06.

## 1. Gom evidence thành cụm

Gom theo **workflow/pain**, không gom theo tên feature.

| Cụm evidence | Evidence liên quan | Kết luận cho build |
|---|---|---|
| Khó tạo bản nháp lịch trình đầu tiên | User phải tự tìm điểm, chia ngày, ước tính chi phí. | AI nên tạo draft lịch trình đầy đủ thay vì chỉ gợi ý địa điểm. |
| Khó cân đối wishlist với thời gian | User có điểm muốn đến nhưng không biết có kịp đi hết không. | Thêm input "must-have places" và trạng thái included/excluded. |
| Sợ vượt ngân sách | Chi phí vé, di chuyển, ăn uống dễ bị thiếu khi lên kế hoạch. | Output phải có tổng chi phí ước tính và check <= 110% budget. |
| Cần sửa sau khi AI tạo | User có thể không đồng ý với thứ tự, địa điểm hoặc chi phí. | Prototype phải có human-in-the-loop: edit, lock, regenerate. |

## 2. Viết insight

```text
User tự lập kế hoạch du lịch không chỉ cần danh sách địa điểm. Họ thật ra cần một bản nháp lịch trình khả thi, có thể tin và sửa được, vì evidence cho thấy điểm gãy nằm ở việc ghép địa điểm - thời gian - budget - sở thích thành một kế hoạch cụ thể.
```

Insight ngắn gọn:

- Surface problem: Tạo lịch trình thủ công mất thời gian.
- Deeper need: Cần decision support để biết lịch trình có khả thi không.
- Trust need: Cần thấy chi phí, lý do sắp xếp và điểm nào được/không được đưa vào.
- Recovery need: Cần sửa và tạo lại nhanh khi AI không đúng ý.

## 3. Viết opportunity

```text
Cơ hội là dùng AI để tự động tạo draft lịch trình theo ràng buộc hẹp, giúp user có ngay một kế hoạch theo ngày/buổi phù hợp thời gian, điểm đến, wishlist và budget, trong khi vẫn kiểm soát rủi ro bằng budget checker, trạng thái included/excluded cho must-have places và flow user review/sửa.
```

## 4. Chọn build slice

| Câu hỏi | Đạt khi | Trạng thái của nhóm |
|---|---|---|
| User cụ thể chưa? | Nói được ai dùng, trong bối cảnh nào. | Đạt: người tự lập lịch trình du lịch, có budget và (có thể) wishlist. |
| Task đủ hẹp chưa? | Demo được trong 3-5 phút. | Đạt: form input -> AI draft -> user sửa/regenerate. |
| AI decision rõ chưa? | AI gợi ý/tự làm một việc cụ thể. | Đạt: AI tạo lịch trình chia ngày/buổi và ước tính chi phí. |
| Failure path rõ chưa? | Có một case AI không chắc hoặc sai để test. | Đạt: budget thấp + quá nhiều must-have places => không có thông báo |
| Có evidence không? | Có bằng chứng từ self-use/review/user/competitor. | Tạm đạt: self-use + giả định phỏng vấn; cần bổ sung screenshot/checkpoint M1. |

Build slice đã chốt:

```text
AI Itinerary Draft cho Gody.vn:
- User nhập thời gian, điểm đi, điểm đến, budget và must-have places.
- AI tạo lịch trình theo ngày/buổi, ước tính chi phí, đảm bảo tổng chi phí <= 110% budget.
- Nếu không thể đáp ứng, AI báo xung đột và để user chọn ưu tiên.
- User có thể sửa lịch trình và yêu cầu AI tạo lại phần bị ảnh hưởng.
```

## 5. Quyết định: giữ, giảm scope, hay đổi hướng?

| Tình huống | Quyết định |
|---|---|
| Evidence yếu, user mơ hồ | Không mở rộng sang booking/bản đồ. |
| Ý tưởng quá rộng | Giảm scope: không build đặt vé/khách sạn, không tối ưu route bằng bản đồ thật trong Day 06. |
| AI không cần thiết | Vẫn cần AI vì task gồm nhiều biến mở: sở thích, thời gian, địa điểm, budget. |
| Rủi ro cao | Chọn conditional automation, user review và duyệt cuối. |
| Không demo được trong 1 ngày | Giữ prototype ở mức form + output + edit/regenerate; backlog phần bản đồ, booking, realtime price. |

Quyết định cuối:

```text
Giữ hướng AI itinerary planner, nhưng giảm scope vào một flow tạo draft lịch trình có check budget và có human-in-the-loop.
Không build full travel super-app trong Day 06.
```

## 6. Câu chốt cuối

```text
Dựa trên self-use Gody.vn, giả định phỏng vấn nhanh và analog từ các AI trip planner, nhóm sẽ build prototype AI tạo bản nháp lịch trình du lịch, cho người trẻ đang tự lập kế hoạch du lịch tự túc, để giải quyết pain mất thời gian sắp xếp địa điểm, cân đối wishlist và kiểm soát ngân sách, bằng cách AI tự động tạo lịch trình theo thời gian, điểm đi, điểm đến, budget và must-have places, và sẽ test failure path budget thấp/quá nhiều điểm muốn đến làm AI có nguy cơ tạo lịch trình vượt quá 110% budget.
```

## 7. Backlog

Những thứ **không build trong Day 06**:

- Booking vé máy bay, khách sạn, tour, nhà hàng trực tiếp trong Gody.vn.
- Giá realtime từ nhà cung cấp và thanh toán.
- Tối ưu route bằng bản đồ thật / traffic realtime.
- Gợi ý cá nhân hóa sâu dựa trên lịch sử du lịch dài hạn.
- Multi-user collaborative planning cho nhóm bạn/gia đình.
