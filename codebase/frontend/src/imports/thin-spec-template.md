# Thin SPEC Cuối Day 05 - Gody.vn AI Itinerary Planner

Thin SPEC không phải PRD đầy đủ. Đây là bản cam kết đủ rõ để sáng Day 06 nhóm build ngay.

## 1. Track, product/app và user

**Track:** AI productivity / Travel planning assistant  
**Product/app thật:** Gody.vn  
**User cụ thể:** Người trẻ / sinh viên / nhân viên văn phòng đang tự lập lịch trình du lịch tự túc, có budget giới hạn.  
**Nhóm có phải user thật không? Nếu không, khác ở đâu?** Có một phần. Nhóm có thể là user thật nếu từng tự lên kế hoạch du lịch; tuy nhiên user mục tiêu rộng hơn có thể có kinh nghiệm du lịch, budget và mức độ linh hoạt khác nhau.

## 2. Evidence summary

| Evidence | Nguồn | User/pain nói lên điều gì? | SPEC phải đổi gì? |
|---|---|---|---|
| Tạo lịch trình hiện tại yêu cầu user tự tìm điểm, chia ngày và ước tính chi phí. | Self-use Gody.vn | Pain nằm ở bước tạo bản nháp đầu tiên, không phải chỉ ở bước lưu lịch trình. | Build slice tập trung vào AI tạo draft lịch trình. |
| User có wishlist địa điểm nhưng không biết có kịp đi hết hay không. | Phỏng vấn, self-use | Cần AI xử lý ràng buộc và giải thích trade-off. | Thêm input "điểm muốn đến" và path low-confidence khi không thể đưa hết vào lịch trình. |
| User mất thời gian tính toán lại budget vì chi phí ăn uống, di chuyển, vé tham quan khó ước tính. | Quan sát workflow | Output phải có chi phí ước tính và cảnh báo vượt ngân sách. | Đặt acceptance: tổng chi phí không vượt 10% budget ban đầu; nếu vượt phải yêu cầu user điều chỉnh. |

## 3. Pain statement

```text
- User là người tự lập kế hoạch du lịch đang gặp khó ở bước tạo lịch trình chi tiết, vì họ phải tự chọn địa điểm, sắp xếp theo ngày, cân đối wishlist với thời gian và ước tính chi phí, dẫn tới tốn nhiều thời gian, dễ bỏ sót điểm quan trọng hoặc tạo lịch trình vượt ngân sách.
- Bằng chứng chính là self-use workflow Gody.vn và giả định phỏng vấn nhanh cho thấy user cần một bản nháp lịch trình có thể sửa được, thay vì tự làm từ đầu.
```


## 4. Build slice

```text
Cho user đang tạo lịch trình du lịch trên Gody.vn, prototype sẽ dùng AI để tự động tạo bản nháp lịch trình theo ràng buộc hẹp, tạo ra lịch trình theo ngày/buổi gồm địa điểm, thời gian, ghi chú di chuyển và chi phí ước tính, và xử lý trường hợp không đủ điều kiện bằng cách báo rõ ràng buộc nào đang xung đột, để user sửa input hoặc chọn ưu tiên lại.
```

Input tối thiểu:

- Thời gian chuyến đi: ngày bắt đầu, ngày kết thúc hoặc số ngày.
- Điểm đi.
- Điểm đến.
- Budget dự kiến.
- Các điểm user muốn đến / must-have places. (optinal)

Output tối thiểu:

- Lịch trình chia theo ngày và buổi.
- Tổng chi phí ước tính, không vượt quá 110% budget ban đầu.
- Danh sách điểm must-have đã đưa vào / chưa đưa vào kèm lý do.
- Nút/flow để user sửa, xóa, thêm địa điểm, đổi budget và yêu cầu AI tạo lại.

## 5. Auto/Aug decision

Chọn một:

- [ ] **Augmentation:** AI gợi ý/draft/phân loại, user quyết cuối.
- [x] **Conditional automation:** AI tự làm trong case hẹp; case mơ hồ/rủi ro chuyển người.
- [ ] **Automation:** AI tự quyết và tự hành động.

**Lý do chọn:** AI có thể tự tạo draft lịch trình khi input đầy đủ và ràng buộc hợp lý. Tuy nhiên lịch trình liên quan đến sở thích, ngân sách và thời gian thật của user, nên khi budget quá thấp, thời gian quá ngắn, địa điểm quá nhiều hoặc thông tin mơ hồ, hệ thống phải hỏi lại/user chỉnh sửa.  
**Human role:** reviewer, decider, rescuer.

## 6. Four paths

| Path | Prototype phải thể hiện gì? |
|---|---|
| Happy | User nhập Đà Nẵng, 3 ngày, budget 5.000.000 VND, wishlist Bà Nà Hills, Hội An, Mỹ Khê. AI tạo lịch trình 3 ngày, đưa đủ wishlist hợp lý, tổng chi phí <= 5.500.000 VND. |
| Low-confidence | User nhập quá nhiều điểm cho 2 ngày hoặc budget sát/không rõ. AI không tự khẳng định; hiện cảnh báo "có thể không kịp/không đủ budget", gợi ý 2-3 cách ưu tiên. |
| Failure | AI tạo lịch trình vượt >110% budget hoặc bỏ qua điểm must-have mà không giải thích. Prototype phải bắt lỗi bằng budget checker / constraint checker và yêu cầu regenerate. |
| Correction | User sửa lịch trình: xóa một địa điểm, thêm điểm mới, tăng/giảm budget hoặc khóa một địa điểm bắt buộc. AI tạo lại phần bị ảnh hưởng và giữ các phần user đã khóa. |

## 7. Failure mode nguy hiểm nhất

```text
- Nếu user nhập budget thấp, thời gian ngắn nhưng wishlist có nhiều điểm xa nhau, AI có thể tạo lịch trình nghe có vẻ hợp lý nhưng vượt budget hoặc không khả thi về thời gian, hậu quả là user tin vào lịch trình sai, đặt dịch vụ/di chuyển không phù hợp và mất tiền/thời gian.
- Prototype sẽ xử lý bằng constraint checker: tổng chi phí phải <= 110% budget, mỗi điểm must-have phải có trạng thái included/excluded và lý do, trường hợp xung đột phải hỏi user ưu tiên lại thay vì tạo lịch trình chắc chắn sai.
- Owner kiểm thử path này là Nguyễn Quốc Tiến.
```

## 8. Owner plan cho sáng Day 06

| Thành viên | Việc phụ trách | Bằng chứng cần có trong repo |
|---|---|---|
| Nguyễn Thị Yến | Research / evidence | Screenshot self-use Gody.vn, notes 2-3 phỏng vấn nhanh, file evidence pack đã điền. |
| Hoàng Long Vũ | SPEC | Thin SPEC có pain statement, build slice, auto/aug decision và four paths. |
| Hoàng Ích Cao Sơn | Prototype | Form input + màn hình output lịch trình + logic check budget <= 110%. |
| Nguyễn Quốc Tiến | Test / failure path | Test case happy, low-confidence, failure, correction; screenshot kết quả mỗi path. |
| Thiệu Quang Minh | Demo script / repo | Demo script 3-5 phút và README ngắn cách chạy prototype. |
