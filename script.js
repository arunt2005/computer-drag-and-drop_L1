// --- Quiz Configuration Data ---
const quizData = [
  {
    "athlete": "scanner",
    "question": "A device that is used for converting printed documents or photos into electronic formats is called a _______________."
  },
  {
    "athlete": "touchpad",
    "question": "A _______________ is an input device that is usually used on a laptop and works by sensing the user's finger movement and the applied pressure."
  },
  {
    "athlete": "MICR",
    "question": "_______________ is used in banks to read the information written on cheques."
  },
  {
    "athlete": "Dot-matrix, laser",
    "question": "_______________ is an impact printer whereas _______________ is a non-impact printer."
  },
  {
    "athlete": "ROM",
    "question": "BIOS is stored on _______________."
  },
  {
    "athlete": "digital camera",
    "question": "A _______________ is used to capture images and store them in a digital format."
  }
];

document.addEventListener('DOMContentLoaded', () => {
    const helpBox = document.getElementById('helpBox');
    const questionsContainer = document.getElementById('questionsContainer');
    const submitBtn = document.getElementById('submitBtn');

    // --- Dynamic Component Generation ---
    function initializeQuiz() {
        const athletes = quizData.map(item => item.athlete);
        athletes.sort(() => Math.random() - 0.5);

        athletes.forEach(name => {
            const node = document.createElement('div');
            node.className = 'draggable-item';
            node.setAttribute('draggable', 'true');
            node.setAttribute('data-athlete', name);
            node.textContent = name;
            helpBox.appendChild(node);
        });

        quizData.forEach(item => {
            const row = document.createElement('div');
            row.className = 'question-row';
            row.setAttribute('data-answer', item.athlete);

            const p = document.createElement('p');
            p.className = 'question-text';
            p.textContent = item.question;

            const dropZone = document.createElement('div');
            dropZone.className = 'drop-zone';

            row.appendChild(p);
            row.appendChild(dropZone);
            questionsContainer.appendChild(row);
        });

        setupDragAndDrop();
    }

    // --- Helper function to place dragged item into drop target ---
    function placeItemInZone(item, targetZone) {
        if (!item || !targetZone) return;

        if (targetZone === helpBox) {
            helpBox.appendChild(item);
            return;
        }

        if (targetZone.classList.contains('drop-zone')) {
            // Swap rules: Send existing element home if drop target is filled
            if (targetZone.children.length > 0 && targetZone.children[0] !== item) {
                helpBox.appendChild(targetZone.children[0]);
            }
            targetZone.appendChild(item);
        }
    }

    // --- Drag & Drop + Touch Support Bindings ---
    function setupDragAndDrop() {
        const draggables = document.querySelectorAll('.draggable-item');
        const dropZones = document.querySelectorAll('.drop-zone');

        // ---------------- Desktop Mouse Events ----------------
        draggables.forEach(draggable => {
            draggable.addEventListener('dragstart', () => draggable.classList.add('dragging'));
            draggable.addEventListener('dragend', () => draggable.classList.remove('dragging'));
        });

        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('drop-zone--over');
            });

            zone.addEventListener('dragleave', () => zone.classList.remove('drop-zone--over'));

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drop-zone--over');
                const draggedItem = document.querySelector('.dragging');
                placeItemInZone(draggedItem, zone);
            });
        });

        helpBox.addEventListener('dragover', (e) => e.preventDefault());
        helpBox.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggedItem = document.querySelector('.dragging');
            if (draggedItem) helpBox.appendChild(draggedItem);
        });

        // ---------------- Mobile Touch Events ----------------
        let touchDraggedItem = null;
        let touchGhost = null;
        let initialX = 0, initialY = 0;

        draggables.forEach(item => {
            item.addEventListener('touchstart', (e) => {
                touchDraggedItem = item;
                const touch = e.touches[0];
                initialX = touch.clientX;
                initialY = touch.clientY;

                // Create a floating visual clone during drag
                touchGhost = item.cloneNode(true);
                touchGhost.classList.add('touch-ghost');
                
                // Set initial position
                const rect = item.getBoundingClientRect();
                touchGhost.style.width = `${rect.width}px`;
                touchGhost.style.left = `${rect.left}px`;
                touchGhost.style.top = `${rect.top}px`;
                
                document.body.appendChild(touchGhost);
                item.classList.add('dragging');
            }, { passive: false });

            item.addEventListener('touchmove', (e) => {
                if (!touchGhost) return;
                e.preventDefault(); // Prevent page scrolling while dragging an answer

                const touch = e.touches[0];
                const deltaX = touch.clientX - initialX;
                const deltaY = touch.clientY - initialY;

                const rect = item.getBoundingClientRect();
                touchGhost.style.left = `${rect.left + deltaX}px`;
                touchGhost.style.top = `${rect.top + deltaY}px`;

                // Highlight dropzone under finger
                touchGhost.style.visibility = 'hidden'; // Temporarily hide to get underlying element
                const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                touchGhost.style.visibility = 'visible';

                document.querySelectorAll('.drop-zone, .help-box').forEach(z => z.classList.remove('drop-zone--over'));
                if (elemBelow) {
                    const zone = elemBelow.closest('.drop-zone, .help-box');
                    if (zone) zone.classList.add('drop-zone--over');
                }
            }, { passive: false });

            item.addEventListener('touchend', (e) => {
                if (!touchGhost) return;

                const touch = e.changedTouches[0];
                touchGhost.style.visibility = 'hidden';
                const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                
                if (touchGhost.parentNode) {
                    touchGhost.parentNode.removeChild(touchGhost);
                }
                touchGhost = null;

                item.classList.remove('dragging');
                document.querySelectorAll('.drop-zone, .help-box').forEach(z => z.classList.remove('drop-zone--over'));

                if (elemBelow) {
                    const dropZone = elemBelow.closest('.drop-zone');
                    const helpBoxZone = elemBelow.closest('.help-box, .help-box-panel');

                    if (dropZone) {
                        placeItemInZone(item, dropZone);
                    } else if (helpBoxZone) {
                        placeItemInZone(item, helpBox);
                    }
                }
                touchDraggedItem = null;
            });
        });
    }

    // --- Answer Verification logic ---
    submitBtn.addEventListener('click', () => {
        const rows = document.querySelectorAll('.question-row');
        let score = 0;
        const total = rows.length;

        rows.forEach(row => {
            const correctAnswer = row.getAttribute('data-answer');
            const dropZone = row.querySelector('.drop-zone');
            const droppedItem = dropZone.querySelector('.draggable-item');
            
            row.classList.remove('correct', 'incorrect');

            if (droppedItem) {
                const userAnswer = droppedItem.getAttribute('data-athlete');
                if (userAnswer === correctAnswer) {
                    row.classList.add('correct');
                    score++;
                } else {
                    row.classList.add('incorrect');
                }
            } else {
                row.classList.add('incorrect');
            }
        });

        const resultBox = document.getElementById('resultBox');
        resultBox.style.display = 'block';
        resultBox.textContent = `You scored ${score} out of ${total}!`;
        
        if (score === total) {
            resultBox.style.background = 'rgba(16, 185, 129, 0.15)';
            resultBox.style.color = '#34d399';
            resultBox.style.border = '1px solid var(--correct)';
        } else {
            resultBox.style.background = 'rgba(247, 37, 133, 0.1)';
            resultBox.style.color = '#f72585';
            resultBox.style.border = '1px solid var(--incorrect)';
        }
    });

    initializeQuiz();
});