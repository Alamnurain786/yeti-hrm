/**
 * PDF Export Utility for Profile
 * Generates a printable PDF version of the employee profile
 */

export const exportProfileToPDF = (user, form) => {
  // Create a new window for printing
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    alert("Please allow popups to export PDF");
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${user.name} - Employee Profile</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
          background: white;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #2563eb;
        }
        
        .header h1 {
          color: #1e293b;
          font-size: 28px;
          margin-bottom: 5px;
        }
        
        .header p {
          color: #64748b;
          font-size: 14px;
        }
        
        .profile-image {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          object-fit: cover;
          margin: 20px auto;
          display: block;
          border: 4px solid #e2e8f0;
        }
        
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        
        .field {
          margin-bottom: 10px;
        }
        
        .field-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .field-value {
          font-size: 14px;
          color: #1e293b;
          margin-top: 4px;
        }
        
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        .table th {
          background: #f1f5f9;
          padding: 10px;
          text-align: left;
          font-size: 12px;
          color: #475569;
          border: 1px solid #e2e8f0;
        }
        
        .table td {
          padding: 10px;
          font-size: 13px;
          border: 1px solid #e2e8f0;
          color: #1e293b;
        }
        
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 2px solid #e2e8f0;
          text-align: center;
          font-size: 12px;
          color: #64748b;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Employee Profile</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>

      ${
        form.profileImage
          ? `<img src="${form.profileImage}" alt="Profile" class="profile-image">`
          : ""
      }

      <!-- Basic Information -->
      <div class="section">
        <div class="section-title">Basic Information</div>
        <div class="grid">
          <div class="field">
            <div class="field-label">Full Name</div>
            <div class="field-value">${user.name || "N/A"}</div>
          </div>
          <div class="field">
            <div class="field-label">Email</div>
            <div class="field-value">${user.email || "N/A"}</div>
          </div>
          <div class="field">
            <div class="field-label">Phone</div>
            <div class="field-value">${user.phone || "N/A"}</div>
          </div>
          <div class="field">
            <div class="field-label">Date of Birth</div>
            <div class="field-value">${form.dateOfBirth || "N/A"} ${
    form.dobBS ? `(${form.dobBS})` : ""
  }</div>
          </div>
          <div class="field">
            <div class="field-label">Gender</div>
            <div class="field-value">${form.gender || "N/A"}</div>
          </div>
          <div class="field">
            <div class="field-label">Age</div>
            <div class="field-value">${form.age || "N/A"} years</div>
          </div>
          <div class="field">
            <div class="field-label">Religion</div>
            <div class="field-value">${form.religion || "N/A"}</div>
          </div>
          <div class="field">
            <div class="field-label">Nationality</div>
            <div class="field-value">${form.nationality || "N/A"}</div>
          </div>
        </div>
      </div>

      <!-- Employment Details -->
      <div class="section">
        <div class="section-title">Employment Details</div>
        <div class="grid">
          <div class="field">
            <div class="field-label">Role</div>
            <div class="field-value">${user.role || "N/A"}</div>
          </div>
          <div class="field">
            <div class="field-label">Department</div>
            <div class="field-value">${user.department || "N/A"}</div>
          </div>
          <div class="field">
            <div class="field-label">Manager</div>
            <div class="field-value">${user.manager || "N/A"}</div>
          </div>
          <div class="field">
            <div class="field-label">Joining Date</div>
            <div class="field-value">${user.joiningDate || "N/A"} ${
    user.joiningDateBS ? `(${user.joiningDateBS})` : ""
  }</div>
          </div>
        </div>
      </div>

      <!-- Identification -->
      <div class="section">
        <div class="section-title">Identification Details</div>
        <div class="grid">
          <div class="field">
            <div class="field-label">Account Holder Name (Nepali)</div>
            <div class="field-value">${
              form.identification?.accountHolderNameNepali || "N/A"
            }</div>
          </div>
          <div class="field">
            <div class="field-label">Citizenship Number</div>
            <div class="field-value">${
              form.identification?.citizenshipNo || "N/A"
            }</div>
          </div>
          <div class="field">
            <div class="field-label">Citizenship Issue Place</div>
            <div class="field-value">${
              form.identification?.citizenshipIssuePlace || "N/A"
            }</div>
          </div>
          <div class="field">
            <div class="field-label">Citizenship Issue Date</div>
            <div class="field-value">${
              form.identification?.citizenshipIssueDate || "N/A"
            }</div>
          </div>
          <div class="field">
            <div class="field-label">PAN Number</div>
            <div class="field-value">${
              form.identification?.panNo || "N/A"
            }</div>
          </div>
          <div class="field">
            <div class="field-label">National ID Card Number</div>
            <div class="field-value">${
              form.identification?.nationalIdCardNo || "N/A"
            }</div>
          </div>
          <div class="field">
            <div class="field-label">Passport Number</div>
            <div class="field-value">${
              form.identification?.passportNo || "N/A"
            }</div>
          </div>
          <div class="field">
            <div class="field-label">Account Number</div>
            <div class="field-value">${
              form.identification?.accountNo || "N/A"
            }</div>
          </div>
        </div>
      </div>

      <!-- Family Details -->
      ${
        form.familyMembers && form.familyMembers.length > 0
          ? `
      <div class="section">
        <div class="section-title">Family Details</div>
        <table class="table">
          <thead>
            <tr>
              <th>Relationship</th>
              <th>Name</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${form.familyMembers
              .map(
                (member) => `
              <tr>
                <td>${member.relationship || ""}</td>
                <td>${member.name || ""}</td>
                <td>${member.remarks || ""}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
      `
          : ""
      }

      <!-- Education -->
      ${
        form.education && form.education.length > 0
          ? `
      <div class="section">
        <div class="section-title">Education</div>
        <table class="table">
          <thead>
            <tr>
              <th>Degree/Level</th>
              <th>Institute</th>
              <th>Year</th>
            </tr>
          </thead>
          <tbody>
            ${form.education
              .map(
                (edu) => `
              <tr>
                <td>${edu.degree || edu.level || ""}</td>
                <td>${edu.institute || edu.institution || ""}</td>
                <td>${edu.year || edu.passedYear || ""}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
      `
          : ""
      }

      <!-- Address -->
      <div class="section">
        <div class="section-title">Address Details</div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; font-weight: 600; color: #475569; margin-bottom: 10px;">Current Address</h3>
          <div class="grid">
            <div class="field">
              <div class="field-label">Municipality/VDC</div>
              <div class="field-value">${
                form.currentAddress?.municipality || "N/A"
              }</div>
            </div>
            <div class="field">
              <div class="field-label">District</div>
              <div class="field-value">${
                form.currentAddress?.district || "N/A"
              }</div>
            </div>
            <div class="field">
              <div class="field-label">Province</div>
              <div class="field-value">${
                form.currentAddress?.province || "N/A"
              }</div>
            </div>
            <div class="field">
              <div class="field-label">Mobile</div>
              <div class="field-value">${
                form.currentAddress?.mobile || "N/A"
              }</div>
            </div>
          </div>
        </div>

        <div>
          <h3 style="font-size: 14px; font-weight: 600; color: #475569; margin-bottom: 10px;">Permanent Address</h3>
          <div class="grid">
            <div class="field">
              <div class="field-label">Municipality/VDC</div>
              <div class="field-value">${
                form.permanentAddress?.municipality || "N/A"
              }</div>
            </div>
            <div class="field">
              <div class="field-label">District</div>
              <div class="field-value">${
                form.permanentAddress?.district || "N/A"
              }</div>
            </div>
            <div class="field">
              <div class="field-label">Province</div>
              <div class="field-value">${
                form.permanentAddress?.province || "N/A"
              }</div>
            </div>
            <div class="field">
              <div class="field-label">Mobile</div>
              <div class="field-value">${
                form.permanentAddress?.mobile || "N/A"
              }</div>
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>This is a computer-generated document. No signature required.</p>
        <p>Generated by HRM System - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
};
