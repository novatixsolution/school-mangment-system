import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from './supabase/client';
import { getDefaultTemplate } from './challan-template-service';
import { getSchoolSettings } from './school-settings';
import { renderChallanTemplate, ChallanData } from './challan-template-renderer';

interface ChallanPDFOptions {
    filename?: string;
    format?: 'a4' | 'a5' | 'letter';
    orientation?: 'portrait' | 'landscape';
}

/**
 * Generate PDF from challan using saved template
 */
export async function generateChallanPDF(
    challanId: string,
    options: ChallanPDFOptions = {}
): Promise<void> {
    try {
        // 1. Load challan with all related data
        const { data: challan, error: challanError } = await supabase
            .from('fee_challans')
            .select(`
        *,
        student:students(
          id,
          name,
          father_name,
          roll_number,
          class:classes(class_name)
        )
      `)
            .eq('id', challanId)
            .single();

        if (challanError || !challan) {
            console.error('Error fetching challan:', challanError);
            throw new Error('Failed to load challan');
        }

        // 2. Load template (use challan's template or default)
        let template;
        if (challan.template_id) {
            const { data } = await supabase
                .from('challan_templates')
                .select('*')
                .eq('id', challan.template_id)
                .single();
            template = data;
        }

        if (!template) {
            template = await getDefaultTemplate();
        }

        if (!template) {
            throw new Error('No template found');
        }

        // 3. Load school settings
        const school = await getSchoolSettings();

        if (!school) {
            throw new Error('School settings not found');
        }

        // 4. Build fee items array
        const fees = [];
        if (challan.monthly_fee > 0) fees.push({ description: 'Monthly Fee', amount: challan.monthly_fee });
        if (challan.exam_fee > 0) fees.push({ description: 'Exam Fee', amount: challan.exam_fee });
        if (challan.admission_fee > 0) fees.push({ description: 'Admission Fee', amount: challan.admission_fee });
        if (challan.other_fees > 0) fees.push({ description: 'Other Fees', amount: challan.other_fees });
        if (challan.previous_balance > 0) fees.push({ description: 'Previous Balance', amount: challan.previous_balance });
        if (challan.discount > 0) fees.push({ description: 'Discount', amount: -challan.discount });

        // 5. Prepare data for template
        const data: ChallanData = {
            student: {
                id: challan.student.id,
                name: challan.student.name,
                father_name: challan.student.father_name,
                roll_number: challan.student.roll_number,
                class_name: challan.student.class?.class_name || 'N/A',
            },
            challan: {
                id: challan.id,
                challan_number: challan.challan_number,
                month: new Date(challan.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                due_date: new Date(challan.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
                total_amount: challan.total_amount,
                student_id: challan.student_id,
            },
            fees,
            school,
        };

        // 6. Render template with data
        const html = renderChallanTemplate(template, data);

        // 7. Generate PDF
        await generatePDFFromHTML(html, {
            filename: options.filename || `challan_${challan.challan_number}.pdf`,
            orientation: template.orientation || 'landscape',
        });

    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
}

/**
 * Generate PDF from HTML string
 */
async function generatePDFFromHTML(html: string, options: ChallanPDFOptions): Promise<void> {
    // Create hidden container
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    try {
        // Convert to canvas
        const canvas = await html2canvas(container, {
            scale: 3,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
        });

        // Create PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: options.orientation || 'landscape',
            unit: 'mm',
            format: 'a4',
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
        pdf.save(options.filename || 'challan.pdf');
    } finally {
        // Clean up
        document.body.removeChild(container);
    }
}

/**
 * Print challan directly (opens print dialog)
 */
export async function printChallan(challanId: string): Promise<void> {
    try {
        // Load challan data
        const { data: challan, error } = await supabase
            .from('fee_challans')
            .select(`
        *,
        student:students(
          id,
          name,
          father_name,
          roll_number,
          class:classes(class_name)
        )
      `)
            .eq('id', challanId)
            .single();

        if (error || !challan) {
            throw new Error('Failed to load challan');
        }

        // Load template
        let template;
        if (challan.template_id) {
            const { data } = await supabase
                .from('challan_templates')
                .select('*')
                .eq('id', challan.template_id)
                .single();
            template = data;
        }
        if (!template) {
            template = await getDefaultTemplate();
        }

        // Load school settings
        const school = await getSchoolSettings();

        if (!school) {
            throw new Error('School settings not found');
        }

        // Build fees
        const fees = [];
        if (challan.monthly_fee > 0) fees.push({ description: 'Monthly Fee', amount: challan.monthly_fee });
        if (challan.exam_fee > 0) fees.push({ description: 'Exam Fee', amount: challan.exam_fee });
        if (challan.admission_fee > 0) fees.push({ description: 'Admission Fee', amount: challan.admission_fee });
        if (challan.other_fees > 0) fees.push({ description: 'Other Fees', amount: challan.other_fees });
        if (challan.previous_balance > 0) fees.push({ description: 'Previous Balance', amount: challan.previous_balance });
        if (challan.discount > 0) fees.push({ description: 'Discount', amount: -challan.discount });

        // Prepare data
        const data: ChallanData = {
            student: {
                id: challan.student.id,
                name: challan.student.name,
                father_name: challan.student.father_name,
                roll_number: challan.student.roll_number,
                class_name: challan.student.class?.class_name || 'N/A',
            },
            challan: {
                id: challan.id,
                challan_number: challan.challan_number,
                month: new Date(challan.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                due_date: new Date(challan.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
                total_amount: challan.total_amount,
                student_id: challan.student_id,
            },
            fees,
            school,
        };

        // Render and print
        const html = renderChallanTemplate(template, data);

        // Open in new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 500);
        }
    } catch (error) {
        console.error('Error printing challan:', error);
        throw error;
    }
}
