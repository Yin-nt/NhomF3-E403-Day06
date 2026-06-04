# SPEC sản phẩm - Gody.vn AI Itinerary Planner

**Nhóm:** 5 ngón tay  
**Track:** Travel and Hospitality  
**Sản phẩm/App:** Gody.vn  

Bản SPEC này làm rõ định hướng xây dựng tính năng **Tự động tạo bản nháp lịch trình du lịch bằng AI (AI Itinerary Draft)** cho Day 06, dựa trên những bằng chứng thực tế và đánh đổi sản phẩm đã được thống nhất.

---

## 1. Bằng chứng

Nỗi đau mà nhóm giải quyết xuất phát từ việc tạo lịch trình thủ công tốn quá nhiều thời gian và khó kiểm soát ngân sách:
* **Trải nghiệm trực tiếp (Self-use Gody.vn):** Ở flow tạo lịch trình hiện tại, hệ thống chỉ cho phép nhập điểm đến và số ngày. Kết quả trả ra là các "ngày trống" khiến user vẫn phải tự tìm điểm, chia ngày, và điền thủ công chi phí, địa chỉ. Đặc biệt, không có cảnh báo tự động khi chi phí dự kiến vượt ngân sách.
* **Từ người dùng (Phỏng vấn & Quan sát):** Sinh viên/người trẻ tự lên kế hoạch thường có một khoản ngân sách cố định và một "wishlist" các điểm bắt buộc phải đến. Sự cố (Failure mode) phổ biến là tạo ra một lịch trình đẹp mắt nhưng không khả thi về thời gian (không kịp đi trong 2-3 ngày) hoặc vượt quá ngân sách thực tế vì không tính toán kỹ từ đầu.
* **Đối thủ (Trip Planner AI, Wonderplan):** Các mô hình thành công đều yêu cầu input chi tiết (sở thích, ngân sách, số ngày) và trả ra output cấu trúc rõ ràng theo Ngày - Buổi - Chi phí ước tính.

## 2. Lát cắt để build (Build Slice)

Thay vì làm toàn bộ super-app du lịch, nhóm tập trung build một lát cắt hẹp nhưng giải quyết đúng điểm gãy lớn nhất:

**"Cho user đang tạo lịch trình du lịch tự túc trên Gody.vn, AI sẽ tự động tạo bản nháp lịch trình theo ngày/buổi dựa trên các ràng buộc hẹp (điểm đi, điểm đến, thời gian, budget, và must-have places). Hệ thống tích hợp constraint checker đảm bảo tổng chi phí không vượt quá 110% budget ban đầu và giải thích rõ những điểm must-have nào không thể đưa vào, cho phép user review, chỉnh sửa và yêu cầu tạo lại."**

## 3. AI Product Canvas

| Ô | Quyết định của nhóm |
|---|---------------------|
| **Value (Giá trị)** | Dành cho người trẻ/sinh viên đi du lịch tự túc có budget giới hạn. Giải quyết nỗi đau mất thời gian rà soát bản đồ, tính toán tiền bạc và ghép nối các địa điểm thành một bản nháp khả thi. |
| **Trust (Niềm tin)** | AI xây dựng niềm tin bằng cách minh bạch hóa ngân sách (hiển thị chi phí ước tính của từng hoạt động). Nếu không thể nhét hết các điểm "must-have" vào lịch trình vì thiếu thời gian/tiền, AI sẽ báo cáo rõ lý do (Included/Excluded) thay vì lờ đi. |
| **Feasibility (Tính khả thi)** | Hoàn toàn khả thi cho Day 06 khi giới hạn ở mức prototype dạng form input và bảng output. Cắt bỏ các tính năng phức tạp: Không booking, không giá realtime, không tích hợp bản đồ thật ngay lúc này. |
| **Tín hiệu học** | Khi user khóa (lock) một địa điểm, chỉnh sửa ngân sách, hoặc xóa điểm AI gợi ý để thay bằng điểm khác, dữ liệu được ghi nhận để cải thiện trọng số cá nhân hóa và thuật toán tối ưu ràng buộc cho các phiên sau. |

## 4. Tăng năng lực hay tự động hóa (Auto vs. Aug)

Nhóm quyết định chọn **Tự động hóa có điều kiện (Conditional Automation)** kết hợp **Human-in-the-loop**.
* **Lý do:** Kế hoạch du lịch ảnh hưởng trực tiếp đến tiền bạc và thời gian thực của người dùng. AI có thể tự động hoàn thành phần nặng nhọc nhất là tạo draft ban đầu khi dữ liệu hợp lý. Tuy nhiên, ở các tình huống mơ hồ (budget quá thấp, số điểm đến quá dày đặc), AI sẽ lùi lại, báo cáo xung đột và yêu cầu con người đưa ra ưu tiên. Người dùng luôn là người chốt duyệt và chỉnh sửa cuối cùng.

## 5. Bốn đường đi của trải nghiệm

| Đường đi | Kịch bản trải nghiệm |
|----------|---------|
| **Đường thuận (Happy Path)** | User nhập 3 ngày tại Đà Nẵng, budget 5.000.000đ, muốn đi Bà Nà Hills và Hội An. AI tạo lịch trình mượt mà, phân bổ thời gian hợp lý, đưa đủ wishlist và tổng chi phí ước tính <= 5.500.000đ. |
| **Khi AI không chắc (Low-confidence)** | User nhập quá nhiều điểm cho chuyến đi 2 ngày hoặc budget quá sát. AI không tự ý gạch bỏ mà hiện cảnh báo: "Có thể không kịp thời gian/Không đủ budget", đồng thời đưa ra 2-3 gợi ý để user tự chọn ưu tiên. |
| **Khi AI sai (Failure)** | AI tạo lịch trình vượt >110% budget hoặc tự ý bỏ qua điểm must-have mà không nói lý do. Hệ thống bắt lỗi bằng Budget/Constraint Checker ở backend, chặn output lỗi và yêu cầu AI generate lại trước khi show cho user. |
| **Khi người dùng sửa (Correction)** | User không thích một điểm, quyết định xóa và khóa các điểm còn lại. AI tự động sinh lại (regenerate) khoảng thời gian bị trống mà không làm hỏng các phần user đã chốt. |

## 6. Những kiểu lỗi đáng lo nhất

* **Tình huống:** User nhập ngân sách rất thấp (VD: 1.000.000đ) nhưng đi 3 ngày và chọn toàn các điểm must-have đắt đỏ (vé 500k-800k/điểm) cách xa nhau.
* **Hậu quả:** Trí tuệ nhân tạo (LLM) có xu hướng "chiều lòng" user, tạo ra một lịch trình ảo (ước tính sai chi phí cho vừa ngân sách hoặc phớt lờ chi phí di chuyển). User tin theo sẽ bị vỡ kế hoạch, mất tiền và trải nghiệm tệ.
* **Cách xử lý của Prototype:** Kích hoạt Constraint Checker. Tổng chi phí bắt buộc phải `<= 110% budget`. Mỗi địa điểm must-have phải được dán nhãn trạng thái `Included/Excluded` kèm lý do. Nếu xung đột quá lớn, UI sẽ chặn không hiển thị lịch trình sai, mà yêu cầu user tăng ngân sách hoặc giảm bớt điểm đến.

## 7. Kế hoạch kiểm thử và bằng chứng demo

Khi mang đi demo, nhóm sẽ chứng minh sự hiệu quả bằng 2 ca kiểm thử chính:
1.  **Ca bình thường (Happy):** Nhập input hợp lý để cho ra lịch trình chuẩn. 
2.  **Ca gây nhiễu (Failure/Low-confidence):** Cố tình ép budget thấp và nhồi nhét điểm đến để thể hiện tính năng Budget Checker và khả năng giải thích Trade-off của AI hoạt động tốt ra sao. 
*Tất cả quá trình đều được lưu lại bằng ảnh chụp màn hình, logs và các phiên bản prompt đã điều chỉnh.*

## 8. Phân công

Mỗi thành viên chịu trách nhiệm một mảng cụ thể, đảm bảo có thể tự bảo vệ quyết định của mình trong buổi demo:

* **Nguyễn Thị Yến:** Phụ trách Research / Evidence (Ảnh chụp màn hình self-use, log phỏng vấn, hồ sơ bằng chứng).
* **Hoàng Long Vũ:** Phụ trách SPEC (Bản mô tả định hướng, Pain statement, 4 paths).
* **Hoàng Ích Cao Sơn:** Phụ trách Prototype (Giao diện Form input, màn hình output lịch trình, tích hợp logic check budget).
* **Nguyễn Quốc Tiến:** Phụ trách Test / Failure path (Chạy test các case happy, low-confidence, failure, lấy screenshot chứng minh).
* **Thiệu Quang Minh:** Phụ trách Demo / Repo (Viết kịch bản demo 3-5 phút ngắn gọn và quản lý README cách chạy source code).