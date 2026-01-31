interface Template {
    id?: string;
    name: string;
    display_name: string;
    description?: string;
    theme_name?: string;
    structure: {
        sections: any[];
        global_styles: {
            primary_color: string;
            secondary_color: string;
            accent_color: string;
            font_family: string;
            font_size_base: number;
        };
        page_settings: {
            size: string;
            orientation: string;
        };
    };
}

class TemplateManager {
    /**
     * Export template as JSON file
     */
    static exportTemplate(template: Template): void {
        try {
            const json = JSON.stringify(template, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `${template.name}_${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log('Template exported successfully');
        } catch (error) {
            console.error('Failed to export template:', error);
            throw new Error('Failed to export template');
        }
    }

    /**
     * Import template from JSON file
     */
    static async importTemplate(file: File): Promise<Template> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const json = e.target?.result as string;
                    const template = JSON.parse(json) as Template;

                    // Validate basic structure
                    if (!template.name || !template.structure || !template.structure.sections) {
                        throw new Error('Invalid template format');
                    }

                    // Remove ID for imported template (will be assigned new one on save)
                    delete template.id;

                    resolve(template);
                } catch (error) {
                    reject(new Error('Failed to parse template file'));
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Duplicate a template
     */
    static duplicateTemplate(template: Template): Template {
        const duplicate: Template = JSON.parse(JSON.stringify(template));

        // Update name and display name
        duplicate.name = `${template.name}_copy_${Date.now()}`;
        duplicate.display_name = `${template.display_name} (Copy)`;

        // Remove ID (will be assigned new one on save)
        delete duplicate.id;

        // Update section IDs
        duplicate.structure.sections = duplicate.structure.sections.map((section, index) => ({
            ...section,
            id: `${section.type}_${Date.now()}_${index}`,
        }));

        return duplicate;
    }

    /**
     * Validate template structure
     */
    static validateTemplate(template: any): boolean {
        try {
            if (!template.name || typeof template.name !== 'string') return false;
            if (!template.structure || typeof template.structure !== 'object') return false;
            if (!Array.isArray(template.structure.sections)) return false;
            if (!template.structure.global_styles) return false;
            if (!template.structure.page_settings) return false;

            return true;
        } catch {
            return false;
        }
    }
}

export { TemplateManager };
export type { Template };
