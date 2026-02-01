# 🧠 Drag & Drop Logic: Float Positioning Algorithm

Tài liệu này giải thích chi tiết logic "Float Position" (tương tự LexoRank của Jira) được sử dụng để xử lý việc sắp xếp task trong TaskFlow.

## 1. Vấn đề của cách làm cũ (Integer Position)

Cách tiếp cận truyền thống thường dùng số nguyên liên tiếp (1, 2, 3...) để đánh dấu vị trí.

**Kịch bản:** Bạn có 3 task:
- Task A (Pos: 1)
- Task B (Pos: 2)
- Task C (Pos: 3)

**Hành động:** Bạn muốn chèn **Task D** vào giữa A và B.
- Task D cần Pos: 2.
- ⚠️ **Hậu quả:** Bạn phải +1 cho Task B (thành 3) và Task C (thành 4).
- **Vấn đề:** Nếu danh sách có 10,000 task, bạn phải update 9,999 dòng trong Database chỉ cho 1 lần kéo thả! Điều này gây chậm và dễ lỗi (race condition) khi nhiều người dùng cùng lúc.

---

## 2. Giải pháp: Float Position (Số thực)

Chúng ta sử dụng khoảng cách rất lớn giữa các task (mặc định 1000 đơn vị) và dùng số thực (float) để chia đôi khoảng cách khi chèn.

**Trạng thái ban đầu:**
- Task A (Pos: 1000)
- Task B (Pos: 2000)
- Task C (Pos: 3000)

**Hành động:** Chèn **Task D** vào giữa A và B.

**Logic:**
$$ \text{NewPos} = \frac{\text{Pos(A)} + \text{Pos(B)}}{2} $$
$$ \text{NewPos} = \frac{1000 + 2000}{2} = 1500 $$

**Kết quả:**
- Task A (Pos: 1000)
- **Task D (Pos: 1500)**  ✅
- Task B (Pos: 2000)
- Task C (Pos: 3000)

**Lợi ích:** Chỉ cần update **1 dòng duy nhất** (Task D) trong Database. Task B và C không bị ảnh hưởng.

---

## 3. Chi tiết thuật toán (Backend Implementation)

Khi một task được thả vào cột mới, Backend sẽ lấy danh sách các task trong cột đó (đã sort theo position) và xử lý 4 trường hợp:

### Case 1: Cột đang rỗng (Empty Column)
Không có task nào để tham chiếu.
- **Giá trị:** `10000` (Số khởi đầu an toàn).

### Case 2: Chèn vào đầu danh sách (Insert at TOP)
Task được thả lên trên cùng.
- **Tham chiếu:** Task đầu tiên hiện tại (`FirstTask`).
- **Công thức:** `NewPos = FirstTask.position / 2`
- **Ví dụ:** Vị trí đầu đang là 1000 → Mới sẽ là 500.

### Case 3: Chèn vào cuối danh sách (Insert at BOTTOM)
Task được thả xuống dưới cùng.
- **Tham chiếu:** Task cuối cùng hiện tại (`LastTask`).
- **Công thức:** `NewPos = LastTask.position + 10000`
- **Ví dụ:** Vị trí cuối đang là 3000 → Mới sẽ là 13000.

### Case 4: Chèn vào giữa 2 task (Insert MIDDLE)
Trường hợp phổ biến nhất.
- **Tham chiếu:** Task liền trên (`PrevTask`) và Task liền dưới (`NextTask`).
- **Công thức:** `NewPos = (PrevTask.position + NextTask.position) / 2`
- **Ví dụ:** Giữa 1500 và 2000 → `(1500 + 2000) / 2 = 1750`.

---

## 4. Frontend Handling (Optimistic UI)

Để trải nghiệm người dùng mượt mà (không bị giật lag chờ server), Frontend thực hiện **Optimistic Update**:

1.  **Ngay khi thả chuột:** Frontend tự tính toán vị trí "giả" và cập nhật State ngay lập tức. User thấy task di chuyển tức thì.
2.  **Gửi API ngầm:** Frontend gửi request `reorderTask` xuống Backend.
3.  **Đồng bộ hóa:**
    *   Backend tính toán lại chính xác vị trí Float và lưu vào DB.
    *   Frontend fetch lại data mới nhất để đảm bảo đồng bộ (đặc biệt quan trọng nếu logic tính toán ở Client và Server lệch nhau).
    *   **Sorting:** Frontend luôn sort task list theo `position` khi render để đảm bảo hiển thị đúng dù thứ tự trong array trả về có lộn xộn.

## 5. Tại sao cần Migration?

Do hệ thống cũ chưa có field `position` (hoặc default = 0), chúng ta cần chạy script migration để "rải" lại vị trí cho các task cũ:
- Task cũ 1 → Pos: 1000
- Task cũ 2 → Pos: 2000
- ...

Điều này tạo ra "khoảng trống" để thuật toán chia đôi có thể hoạt động hiệu quả ngay từ đầu.
