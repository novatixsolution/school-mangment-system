interface Section {
    id: string;
    type: 'header' | 'student_info' | 'fee_table' | 'footer';
    order: number;
    visible: boolean;
    config: Record<string, any>;
}

class ClipboardManager {
    private static STORAGE_KEY = 'template_clipboard';

    static copySection(section: Section): void {
        try {
            const data = JSON.stringify(section);
            localStorage.setItem(this.STORAGE_KEY, data);
            console.log('Section copied to clipboard');
        } catch (error) {
            console.error('Failed to copy section:', error);
            throw new Error('Failed to copy section');
        }
    }

    static pasteSection(): Section | null {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return null;

            const section = JSON.parse(data) as Section;

            // Generate new ID for pasted section
            section.id = `${section.type}_${Date.now()}`;

            return section;
        } catch (error) {
            console.error('Failed to paste section:', error);
            return null;
        }
    }

    static hasClipboard(): boolean {
        return localStorage.getItem(this.STORAGE_KEY) !== null;
    }

    static clearClipboard(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }
}

export { ClipboardManager };
export type { Section };
