// 1. Import các thứ cần dùng
import { Search, Plus } from 'lucide-react';
import './Header.css'; // Import CSS cho component này

// 2. Định nghĩa kiểu Props (TypeScript)
interface HeaderProps {
    onCreateTask: () => void;        // Function không có tham số, không return gì
    onSearch: (query: string) => void; // Function nhận string, không return gì
}

// 3. Tạo component function
function Header({ onCreateTask, onSearch }: HeaderProps) {
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        onSearch(query);
    };
    return (
        <header className="header">
            <div className="header-logo">
                <h1>TaskFlow</h1>
            </div>
            <div className="header-search">
                <Search size={20} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search tasks..."
                    onChange={handleSearchChange}
                    className="search-input"
                />
            </div>
            <div className="header-actions">
                <button className="btn-create" onClick={onCreateTask}>
                    <Plus size={20} />
                    Create Task
                </button>
            </div>
        </header>
    );
}

// 4. Export để dùng ở nơi khác
export default Header;