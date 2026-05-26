// backend/services/universityIdSync.js
import Student from '../models/Student.js';
import StudentSync from '../models/StudentSync.js';

// University ID Integration Service
class UniversityIDService {
    constructor() {
        // For now, use mock data. Replace with actual API when available
        this.useMockAPI = true;
        this.apiUrl = process.env.UNIVERSITY_API_URL || 'https://university-api.ju.edu.et';
        this.apiKey = process.env.UNIVERSITY_API_KEY;
    }

    async fetchStudentsFromUniversity(lastSyncDate = null) {
        try {
            if (this.useMockAPI) {
                // Mock data for testing
                return {
                    students: [
                        {
                            studentId: 'RU0830/16',
                            name: 'Petros Bekana',
                            department: 'Electrical Engineering',
                            program: 'BSc',
                            year: 4,
                            email: 'petros.bekana@ju.edu.et',
                            phone: '0912345678',
                            enrollmentStatus: 'active',
                            lastUpdated: new Date()
                        },
                        {
                            studentId: 'RU1004/16',
                            name: 'Tewodros Kifle',
                            department: 'Computer Science',
                            program: 'BSc',
                            year: 4,
                            email: 'tewodros.kifle@ju.edu.et',
                            phone: '0923456789',
                            enrollmentStatus: 'active',
                            lastUpdated: new Date()
                        },
                        {
                            studentId: 'RU1046/16',
                            name: 'Wakoya Daba',
                            department: 'Mechanical Engineering',
                            program: 'BSc',
                            year: 4,
                            email: 'wakoya.daba@ju.edu.et',
                            phone: '0934567890',
                            enrollmentStatus: 'active',
                            lastUpdated: new Date()
                        },
                        {
                            studentId: 'RR1813/15',
                            name: 'Tariku Mato',
                            department: 'Civil Engineering',
                            program: 'BSc',
                            year: 5,
                            email: 'tariku.mato@ju.edu.et',
                            phone: '0945678901',
                            enrollmentStatus: 'active',
                            lastUpdated: new Date()
                        },
                        {
                            studentId: 'RU0965/16',
                            name: 'Sudeys Mohammed',
                            department: 'Information Technology',
                            program: 'BSc',
                            year: 4,
                            email: 'sudeys.mohammed@ju.edu.et',
                            phone: '0956789012',
                            enrollmentStatus: 'active',
                            lastUpdated: new Date()
                        }
                    ],
                    timestamp: new Date()
                };
            }

            // Real API call (when available)
            // const response = await fetch(`${this.apiUrl}/students`, {
            //   headers: { 'Authorization': `Bearer ${this.apiKey}` },
            //   params: lastSyncDate ? { updatedAfter: lastSyncDate } : {}
            // });
            // return await response.json();

        } catch (error) {
            console.error('University API error:', error);
            throw new Error('Failed to fetch students from university system');
        }
    }

    async syncStudents(triggeredBy) {
        const syncLog = await StudentSync.create({
            triggeredBy,
            status: 'processing'
        });

        try {
            // Get last sync date
            const lastSync = await StudentSync.findOne({ status: 'completed' })
                .sort({ syncDate: -1 });

            const universityData = await this.fetchStudentsFromUniversity(lastSync?.syncDate);

            let newCount = 0;
            let updatedCount = 0;
            let deactivatedCount = 0;

            for (const uniStudent of universityData.students) {
                const existing = await Student.findOne({ student_id: uniStudent.studentId });

                if (!existing) {
                    // New student
                    await Student.create({
                        student_id: uniStudent.studentId,
                        name: uniStudent.name,
                        department: uniStudent.department,
                        program: uniStudent.program || 'BSc',
                        year: uniStudent.year || 1,
                        email: uniStudent.email,
                        phone: uniStudent.phone,
                        eligibility_status: uniStudent.enrollmentStatus === 'active',
                        is_intern: false,
                        is_non_cafe: false,
                        source: 'university_sync',
                        imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(uniStudent.name)}&background=0f4d28&color=fff`
                    });
                    newCount++;
                } else {
                    // Update existing if changed
                    let needsUpdate = false;
                    const updates = {};

                    if (existing.name !== uniStudent.name) {
                        updates.name = uniStudent.name;
                        needsUpdate = true;
                    }
                    if (existing.department !== uniStudent.department) {
                        updates.department = uniStudent.department;
                        needsUpdate = true;
                    }
                    if (existing.program !== uniStudent.program) {
                        updates.program = uniStudent.program;
                        needsUpdate = true;
                    }
                    if (existing.year !== uniStudent.year) {
                        updates.year = uniStudent.year;
                        needsUpdate = true;
                    }

                    const newEligibility = uniStudent.enrollmentStatus === 'active';
                    if (existing.eligibility_status !== newEligibility) {
                        updates.eligibility_status = newEligibility;
                        needsUpdate = true;
                    }

                    if (needsUpdate) {
                        await Student.updateOne({ _id: existing._id }, { $set: updates });
                        updatedCount++;
                    }
                }
            }

            // Check for students no longer in university system
            const allLocalStudents = await Student.find({ source: 'university_sync' });
            const universityIds = new Set(universityData.students.map(s => s.studentId));

            for (const localStudent of allLocalStudents) {
                if (!universityIds.has(localStudent.student_id)) {
                    // Student no longer in university - deactivate
                    await Student.updateOne(
                        { _id: localStudent._id },
                        { $set: { eligibility_status: false, is_non_cafe: true } }
                    );
                    deactivatedCount++;
                }
            }

            // Update sync log
            syncLog.status = 'completed';
            syncLog.totalProcessed = universityData.students.length;
            syncLog.newStudents = newCount;
            syncLog.updatedStudents = updatedCount;
            syncLog.deactivatedStudents = deactivatedCount;
            await syncLog.save();

            return {
                success: true,
                newCount,
                updatedCount,
                deactivatedCount,
                total: universityData.students.length,
                syncLog
            };
        } catch (error) {
            syncLog.status = 'failed';
            syncLog.errorLog = [error.message];
            await syncLog.save();
            throw error;
        }
    }

    async getSyncHistory(limit = 10) {
        return await StudentSync.find()
            .sort({ syncDate: -1 })
            .limit(limit)
            .populate('triggeredBy', 'fullName username');
    }

    async validateStudentId(studentId) {
        try {
            // Check in local database first
            const student = await Student.findOne({ student_id: studentId });

            if (student) {
                return {
                    valid: true,
                    student: {
                        student_id: student.student_id,
                        name: student.name,
                        department: student.department,
                        program: student.program,
                        year: student.year,
                        eligibility_status: student.eligibility_status
                    },
                    message: 'Student ID is valid'
                };
            }

            // If not found locally, try to fetch from university API
            if (!this.useMockAPI) {
                // const response = await fetch(`${this.apiUrl}/students/${studentId}`);
                // if (response.ok) {
                //   const data = await response.json();
                //   return { valid: true, student: data, message: 'Student ID valid' };
                // }
            }

            return {
                valid: false,
                student: null,
                message: 'Student ID not found in university system'
            };
        } catch (error) {
            return {
                valid: false,
                message: 'Validation service unavailable'
            };
        }
    }

    async getStudentFromUniversity(studentId) {
        try {
            const student = await Student.findOne({ student_id: studentId });
            return student;
        } catch (error) {
            return null;
        }
    }
}

export default new UniversityIDService();