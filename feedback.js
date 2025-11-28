// feedback.js — validation, localStorage persistence, CSV export
(function(){
  const form = document.getElementById('feedbackForm');
  const submissionsTable = document.getElementById('submissionsTable');
  const tableBody = submissionsTable ? submissionsTable.querySelector('tbody') : null;
  const empty = document.getElementById('empty');
  const clearBtn = document.getElementById('clearBtn');
  const exportBtn = document.getElementById('exportBtn');

  const STORAGE_KEY = 'studentFeedbacks_v1';

  function load() {
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(e){
      console.error('Failed to parse storage', e);
      return [];
    }
  }

  function save(list){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function render(){
    const list = load();
    if(tableBody) tableBody.innerHTML = '';
    if(list.length === 0){
      if(empty) empty.style.display = 'block';
      if(submissionsTable) submissionsTable.style.display = 'none';
      return;
    }
    if(empty) empty.style.display = 'none';
    if(submissionsTable) submissionsTable.style.display = '';

    list.forEach((item, idx) => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td data-label="#">${idx+1}</td>
        <td data-label="Name">${escapeHtml(item.studentName)}</td>
        <td data-label="Email">${escapeHtml(item.email)}</td>
        <td data-label="Project">${escapeHtml(item.project)}</td>
        <td data-label="Locality">${escapeHtml(item.locality||'—')}</td>
        <td data-label="Rating">${escapeHtml(item.rating)}</td>
        <td data-label="Comments">${escapeHtml(item.comments||'')}</td>
        <td data-label="Action"><button data-idx="${idx}">Delete</button></td>
      `;

      const delBtn = tr.querySelector('button');
      if(delBtn){
        delBtn.addEventListener('click', ()=>{
          const i = Number(delBtn.dataset.idx);
          remove(i);
        });
      }

      tableBody.appendChild(tr);
    });
  }

  function escapeHtml(s){
    if(!s) return '';
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
  }

  function add(entry){
    const list = load();
    list.push(Object.assign({created: new Date().toISOString()}, entry));
    save(list);
    render();
  }

  function remove(index){
    const list = load();
    if(index<0 || index>=list.length) return;
    list.splice(index,1);
    save(list);
    render();
  }

  function clearAll(){
    if(!confirm('Delete all feedback entries?')) return;
    localStorage.removeItem(STORAGE_KEY);
    render();
  }

  function exportCSV(){
    const list = load();
    if(list.length === 0){ alert('No data to export'); return; }
    const header = ['Student Name','Email','Project','Locality','Rating','Comments','Created'];
    const rows = [header];
    list.forEach(r => rows.push([r.studentName, r.email, r.project, r.locality||'', r.rating, (r.comments||'').replace(/\r?\n/g,' '), r.created]));
    const csv = rows.map(row => row.map(cell => '"'+String(cell).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-feedback.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if(!form){
    console.warn('feedback.js: form element not found, aborting.');
    return;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const fm = new FormData(form);
    const entry = {
      studentName: fm.get('studentName')?.trim(),
      email: fm.get('email')?.trim(),
      project: fm.get('project')?.trim(),
      locality: fm.get('locality')?.trim(),
      rating: fm.get('rating')?.trim(),
      comments: fm.get('comments')?.trim()
    };

    // Basic validation
    if(!entry.studentName){ alert('Student name is required'); return; }
    if(!entry.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(entry.email)){ alert('A valid email is required'); return; }
    if(!entry.project){ alert('Project / Subject is required'); return; }
    if(!entry.rating){ alert('Please select a rating'); return; }

    add(entry);
    form.reset();
  });

  if(clearBtn) clearBtn.addEventListener('click', clearAll);
  if(exportBtn) exportBtn.addEventListener('click', exportCSV);

  // initial render
  render();
})();
