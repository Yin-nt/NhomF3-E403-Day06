# Evidence Pack - Gody.vn AI Itinerary Planner

Nộp kèm thin SPEC cuối Day 05.

## 1. Nhóm và track

**Tên nhóm:** 5 ngón tay  
**Track:** Travel and Hospitaliby   
**Product/app đã chọn:** Gody.vn  
**Build slice đang nghĩ:** Tự động tạo lịch trình du lịch bằng AI cho feature "Tạo lịch trình", dựa trên thời gian, điểm đi, điểm đến, budget dự kiến và các địa điểm user muốn đến. User có thể review, sửa từng ngày/từng điểm và yêu cầu AI tạo lại.

## 2. Self-use evidence

Nhóm tự dùng app/workflow và ghi lại điểm gãy.

| Observation | Screenshot/link | Path liên quan | Điều học được |
|---|---|---|---|
| User chỉ nhập được điểm đến và số ngày ở bước đầu, chưa có input về điểm đi, budget dự kiến hoặc các địa điểm bắt buộc muốn đến. | [Ảnh 1 - Form tạo lịch trình](images/pic1.png) | Happy | Workflow hiện tại tạo được khung chuyến đi nhanh, nhưng input chưa đủ để AI/ hệ thống tự lập một lịch trình có ràng buộc ngân sách và wishlist. |
| Sau khi bấm tạo lịch trình, hệ thống tạo ra các ngày trống; user vẫn phải tự thêm hoạt động cho từng ngày. | [Ảnh 2 - Lịch trình trống sau khi tạo](images/pic2.png) | Happy | Product hỗ trợ lưu lịch trình, nhưng chưa tự động hóa phần khó nhất là tạo bản nháp lịch trình chi tiết. |
| Khi thêm hoạt động, user phải nhập thủ công loại hoạt động, nội dung, thời gian, địa chỉ, chi phí và ghi chú. | [Ảnh 3 - Form thêm hoạt động thủ công](images/pic3.png) | Correction | Human-in-the-loop hiện đã có ở dạng nhập/sửa thủ công; prototype AI nên giữ khả năng chỉnh sửa này sau khi AI tạo draft. |
| Khi user có nhiều điểm muốn đến, hệ thống hiển thị gợi ý và bản đồ nhưng user vẫn phải tự quyết định thứ tự, thời gian và độ khả thi của từng điểm. | [Ảnh 4 - Nhiều điểm đến trong lịch trình](images/pic4.png) | Low-confidence | AI nên đóng vai trò sắp xếp draft theo ngày/buổi, gom điểm gần nhau và giải thích nếu không thể đưa hết wishlist vào lịch trình. |
| Khi chi phí thực tế vượt budget dự kiến, hệ thống chỉ hiển thị con số vượt ngân sách, chưa có cảnh báo/đề xuất tự động để sửa lịch trình. | [Ảnh 5 - Chi phí vượt budget](images/pic5.png) | Failure | Prototype cần có budget checker: tổng chi phí không vượt quá 110% budget; nếu vượt phải báo conflict và gợi ý giảm/đổi hoạt động. |

## 3. User / review / social evidence
 
| Quote / review / observation | Nguồn | User là ai? | Pain/failure mode |
|---|---|---|---|
| "Lập lịch trình mất nhiều thời gian vì phải đọc review, xem bản đồ, tính chi phí và sắp xếp từng ngày." | Trực tiếp | Sinh viên / nhân viên trẻ tự lên kế hoạch du lịch | Pain: tốn thời gian tổng hợp và ra quyết định. |
| "Muốn đến vài chỗ nhất định, nhưng không biết có kịp trong 2-3 ngày không." | Giả định từ self-use và phỏng vấn nhanh | User đã có wishlist địa điểm | Low-confidence: user cần AI đánh giá độ khả thi và sắp xếp ưu tiên. |
| "Sợ bị vượt ngân sách vì lúc lên lịch trình không tính hết vé, di chuyển, ăn uống." | Trực tiếp | User có budget cố định | Failure: lịch trình đẹp nhưng không đúng ràng buộc ngân sách. |


```text
Đây là giả định. Nhóm sẽ kiểm bằng 3 phỏng vấn nhanh với người từng tự lập lịch trình du lịch và 1 lần self-use ghi màn hình trên Gody.vn trước checkpoint M1 Day 06.
```

## 4. Competitor / analog evidence

| App / mô hình tham khảo | Họ xử lý task này thế nào? | Pattern học được | Có áp dụng trong 1 ngày không? |
|---|---|---|---|
| Trip Planner AI / Wonderplan | User nhập điểm đến, số ngày, sở thích; hệ thống sinh lịch trình theo ngày. | Nên sinh output theo cấu trúc ngày - buổi - địa điểm - chi phí ước tính. | Có, với phiên bản prototype bằng form input và response dạng bảng. |
| Google Maps / My Maps | User lưu điểm muốn đến và nhìn vị trí trên bản đồ, nhưng việc tối ưu lịch trình vẫn do user tự làm. | Wishlist địa điểm là input quan trọng; cần ưu tiên gom địa điểm gần nhau. | Có một phần: chưa cần bản đồ thật, có thể hiển thị lý do sắp xếp theo khu vực. |


## 5. Evidence -> Insight

```text
Evidence nổi bật nhất:
- User không bị kẹt ở việc tìm điểm đi, mà bị kẹt ở việc tạo bản nháp đầu tiên sắp xếp các điểm đi này cho hợp lý: chọn địa điểm, chia ngày, cân đối thời gian và ngân sách.

Insight:
- User không chỉ gặp vấn đề "không có lịch trình". Thật ra họ cần một bản nháp đáng tin, có giải thích trade-off, có thể sửa được và không làm họ vượt ngân sách quá mức.

Opportunity:
- AI có thể giúp bằng cách tự động tạo draft lịch trình từ các ràng buộc hẹp: thời gian, điểm đi, điểm đến, budget và wishlist. User vẫn là người review, chỉnh sửa và duyệt cuối.
```

## 6. Evidence đổi SPEC như thế nào?

- [ ] Đổi user chính.
- [x] Đổi pain statement.
- [x] Đổi build slice.
- [x] Đổi Auto/Aug decision.
- [x] Đổi 4 paths.
- [x] Đổi failure mode.
- [x] Đổi owner/test plan.

Ghi rõ 1-2 thay đổi quan trọng:

```text
- Trước evidence, nhóm định build AI tạo lịch trình chung chung cho Gody.vn.
Sau evidence, nhóm đổi thành build một AI itinerary planner có ràng buộc ngân sách và wishlist địa điểm.
Lý do: Pain lớn nhất không phải là thiếu gợi ý, mà là khó ghép các gợi ý thành một lịch trình khả thi, không vượt quá 10% budget và vẫn cho user sửa.

- Trước evidence, nhóm có thể để AI quyết định toàn bộ.
Sau evidence, nhóm chọn conditional automation + human-in-the-loop.
Lý do: Lịch trình liên quan đến sở thích, tiền và thời gian thật của user; AI cần tạo draft nhanh, nhưng user phải có quyền sửa, thay địa điểm và duyệt cuối.
```
