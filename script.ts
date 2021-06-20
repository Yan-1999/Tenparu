enum Stage { Backlog, Todo, InProgress, Verify, Done }

const STROAGE_KEY = 'tenparu';
var curStage = Stage.InProgress;

/**
 * `Date.now()`
 * @param datetime time
 * @returns str rep of time difference
 */
function diffTimeStr(datetime: Date) {
    let diff = Date.now() - datetime.getTime();
    let suffix = 'passed';

    if (diff < 0) {
        diff = -diff;
        suffix = 'left';
    }
    if (diff > 86400000) {
        return [Math.floor(diff / 86400000).toString(),
            'days',
            suffix].join(' ');
    }
    else if (diff > 3600000) {
        return [Math.floor(diff / 3600000).toString(),
            'hours',
            suffix].join(' ');
    }
    else {
        return [Math.floor(diff / 60000).toString(),
            'minutes',
            suffix].join(' ');
    }
}

/**
 * Task Class
 */
class Task {
    static tasks: { [key: string]: Task } = {};
    static numTaskInStage: number[] = new Array(Stage.Done + 1);

    name: string;
    due: Date;
    description: string;
    stage: Stage;
    progress: number = 0;
    max_progress: number = 10;

    constructor(name?: string,
        due?: Date,
        description?: string,
        stage?: Stage) {
        this.name = name;
        this.due = due;
        this.description = description;
        this.stage = stage;
    }

    static get undoneCount() {
        let undoneCnt = 0;
        for (let stage = 0; stage < Stage.Done; stage++) {
            const cnt = Task.numTaskInStage[stage];
            undoneCnt += cnt;
        }
        return undoneCnt;
    }

    /**
     * Load Task.tasks form `localStorage` to `Task.tasks`.
     */
    static load() {
        Task.numTaskInStage.fill(0, Stage.Backlog, Stage.Done + 1);
        let tasksStr = window.localStorage.getItem(STROAGE_KEY);
        if (tasksStr !== null) {
            let raw_list = JSON.parse(tasksStr);
            for (const key in raw_list) {
                const raw = raw_list[key];
                raw.due = new Date(raw.due);
                let task = Task.tasks[key] = new Task();
                Object.assign(task, raw);
                Task.numTaskInStage[task.stage]++;
            }
        }
    }

    /**
     * Write `Task.tasks` to `localStorage`.
     */
    static store() {
        window.localStorage.setItem(STROAGE_KEY, JSON.stringify(Task.tasks));
    }

    setProgress(val: number) {
        this.progress = val;
        Task.store();
    }

    /**
     * Set `this.stage`.
     * IGNORE OUT OF RANGE ERROR.
     * @param stage stage to change to
     */
    setStage(stage: Stage) {
        Task.numTaskInStage[this.stage]--;
        Task.numTaskInStage[stage]++;
        this.stage = stage;
        this.progress = 0;
        Task.store();
    }

    static insert(task: Task) {
        Task.tasks[task.name] = task;
        Task.numTaskInStage[task.stage]++;
        Task.store();
    }

    static erase(task: Task) {
        Task.numTaskInStage[task.stage]--;
        delete Task.tasks[task.name];
        Task.store();
    }

    static completeTasksOfStage(stage: Stage) {
        for (const key in Task.tasks) {
            const task = Task.tasks[key];
            if (task.stage === stage) {
                task.progress = task.max_progress;
            }
        }
        Task.store();
    }

    static moveCompleteTasks(form: Stage, to: Stage) {
        let cnt = 0;
        for (const key in Task.tasks) {
            const task = Task.tasks[key];
            if (task.stage === form &&
                task.progress === task.max_progress) {
                task.stage = to;
                task.progress = 0;
                cnt++;
            }
        }
        Task.numTaskInStage[form] -= cnt;
        Task.numTaskInStage[to] += cnt;
        Task.store();
    }

    static eraseCompleteTasksOfStage(stage: Stage) {
        let cnt = 0;
        for (const key in Task.tasks) {
            const task = Task.tasks[key];
            if (task.stage === stage &&
                task.progress === task.max_progress) {
                delete Task.tasks[task.name];
                cnt++;
            }
        }
        Task.numTaskInStage[stage] -= cnt;
        Task.store();
    }

    static eraseDone() {
        for (const key in Task.tasks) {
            const task = Task.tasks[key];
            if (task.stage === Stage.Done) {
                delete Task.tasks[task.name];
            }
        }
        Task.numTaskInStage[Stage.Done] = 0;
        Task.store();
    }
}

class TaskView {
    static taskTemplate = (document.getElementById('task-template') as
        HTMLTemplateElement).content.querySelector<HTMLDivElement>(
            '.task');
    static taskList = document.getElementById('task-list') as HTMLDivElement;
    static addTaskSubmit = document.getElementById('add-task') as HTMLInputElement;
    static completeAllButton = document.getElementById('complete-all');
    static nextCompletedButton = document.getElementById('next-completed');
    static doneCompletedButton = document.getElementById('done-completed');
    static deleteCompletedButton = document.getElementById('delete-completed');
    static undoneCntDiv = document.getElementById('undone') as HTMLDivElement;

    #div: HTMLDivElement;
    #next_button: HTMLButtonElement;
    #done_button: HTMLButtonElement;

    range: HTMLInputElement;

    /**
     * USE `TaskView.create()` TO CREATE A VIEW.
     */
    constructor(div: HTMLDivElement) {
        this.#div = div;
    }

    /**
     * Render new `.task` div using `this`, and set events.
     * @param div div to render
     */
    #renderDiv(task: Task) {
        this.#div.setAttribute('data-name', task.name);
        this.#div.getElementsByClassName(
            'task-item-name')[0].textContent = task.name;
        this.#div.getElementsByClassName(
            'task-item-due')[0].textContent = task.due.toLocaleString();
        this.#div.getElementsByClassName(
            'task-item-description')[0].textContent = task.description;
        this.#div.getElementsByClassName(
            'task-item-timeleft')[0].textContent = diffTimeStr(task.due);
        this.#next_button = this.#div.getElementsByClassName('task-item-next')[0] as
            HTMLButtonElement;
        this.#done_button = this.#div.getElementsByClassName('task-item-done')[0] as
            HTMLButtonElement;
        this.range = this.#div.getElementsByClassName('task-item-progress')[0] as
            HTMLInputElement
        let stage = task.stage;
        if (stage >= Stage.Verify) {
            this.#done_button.style.display = 'none';
        }
        if (stage === Stage.Done) {
            this.#next_button.style.display = 'none';
            this.range.style.display = 'none';
            this.#div.setAttribute('data-done', '');
        } else {
            this.#next_button.textContent = Stage[stage + 1];
            this.range.value = task.progress.toString();
            this.range.max = task.max_progress.toString();
            if (this.range.value === this.range.max) {
                this.#div.setAttribute('data-done', '');
            }
        }
    }

    #bindController(task: Task) {
        let controller = new TaskController(task, this);

        (this.#div.getElementsByClassName('task-item-delete')[0] as
            HTMLButtonElement).onclick = controller.erase.bind(controller);
        this.#done_button.onclick = controller.editStage.bind(controller, Stage.Done);
        if (task.stage !== Stage.Done) {
            this.#next_button.onclick = controller.advanceStage.bind(controller);
            this.range.onchange = controller.editProgress.bind(controller);
        }
    }

    onProgressSet() {
        if (this.range.value === this.range.max) {
            this.#div.setAttribute('data-done', '');
        } else {
            this.#div.removeAttribute('data-done');
        }
    }

    erase() {
        this.#div.remove();
    }

    /* single view functions */

    static createView(task: Task) {
        let div = document.importNode(TaskView.taskTemplate, true);
        let view = new TaskView(div);
        view.#renderDiv(task);
        view.#bindController(task);
        TaskView.taskList.appendChild(view.#div);
        return view;
    }

    /* view list functions */

    /**
     * Load Task.tasks of stage to current page.
     * @param stage stage loading
     */
    static loadView(stage: Stage) {
        TaskView.taskList.innerHTML = '';
        for (const key in Task.tasks) {
            const task = Task.tasks[key];
            if (task.stage === stage) {
                TaskView.createView(task);
            }
        }
    }

    static setViewsCompleted() {
        let childern = this.taskList.children;
        for (let index = 0; index < childern.length; index++) {
            const div = childern[index] as HTMLDivElement;
            let range = div.getElementsByClassName('task-item-progress')[0] as
                HTMLInputElement;
            range.value = range.max;
            div.setAttribute('data-done', '');
        }
    }

    static eraseViews() {
        TaskView.taskList.innerHTML = '';
    }

    static eraseCompletedViews() {
        let child = this.taskList.firstElementChild;
        let lastChild = null;
        while (child) {
            lastChild = child;
            child = lastChild.nextElementSibling;
            let range = lastChild.getElementsByClassName('task-item-progress')[0] as
                HTMLInputElement;
            if (range.value === range.max) {
                lastChild.remove();
            }
        }
    }

    /* page functions */

    /**
     * Change current stage.
     * @param stage stage changing to
     */
    static changeView(stage: Stage) {
        TaskView.loadView(stage);
        for (let index = 0; index <= Stage.Done; index++) {
            let elem = document.getElementById(['stage-',
                Stage[index].toLowerCase()].join(''));
            if (index === stage) {
                elem.setAttribute('data-current', '');
            } else {
                elem.removeAttribute('data-current');
            }
        }
        TaskView.addTaskSubmit.value = ['Add task to', Stage[stage]].join(' ');
        if (stage === Stage.Done) {
            TaskView.completeAllButton.style.display = 'none';
            TaskView.doneCompletedButton.style.display = 'none';
            TaskView.deleteCompletedButton.style.display = 'none';
            TaskView.nextCompletedButton.innerText = 'Remove Done Tasks';
        } else {
            TaskView.completeAllButton.style.display = 'inline-block';
            TaskView.doneCompletedButton.style.display = 'inline-block';
            TaskView.deleteCompletedButton.style.display = 'inline-block';
            TaskView.nextCompletedButton.innerText = ['To', Stage[stage + 1]].join(' ');
        }
    }

    static initStageButtons() {
        let stages_div = document.getElementById('stages');
        for (let index = 0; index <= Stage.Done; index++) {
            const stage_str = Stage[index];
            let button = document.createElement('button');
            button.id = ['stage-', stage_str.toLowerCase()].join('');
            button.textContent = stage_str;
            button.onclick = TaskController.changeToStage.bind(null, index);
            let cntSpan = document.createElement('span');
            cntSpan.innerText = '0';
            button.appendChild(cntSpan);
            stages_div.appendChild(button);
        }
    }

    static bindManipulationButtons() {
        TaskView.completeAllButton.onclick =
            TaskController.completeTasksOfCurStage.bind(null);
        TaskView.nextCompletedButton.onclick =
            TaskController.advanceCompleted.bind(null);
        TaskView.doneCompletedButton.onclick =
            TaskController.doneCompleted.bind(null);
        TaskView.deleteCompletedButton.onclick =
            TaskController.deleteCompleted.bind(null);
    }

    static updateCnt() {
        let undoneCount = 0;
        for (let index = 0; index <= Stage.Done; index++) {
            const cnt = Task.numTaskInStage[index];
            let span = document.getElementById(['stage-',
                Stage[index].toLowerCase()].join(''))
                .getElementsByTagName('span')[0];
            if (cnt === 0) {
                span.style.display = 'none';
            } else {
                span.style.display = 'inherit';
                span.innerText = cnt.toString();
            }
            undoneCount += cnt;
        }
        undoneCount -= Task.numTaskInStage[Stage.Done];
        this.undoneCntDiv.innerText = undoneCount.toString();
    }
}

class TaskController {

    #task: Task;
    #view: TaskView;

    constructor(task: Task, view: TaskView) {
        this.#task = task;
        this.#view = view;
    }

    erase() {
        this.#view.erase();
        Task.erase(this.#task);
        TaskView.updateCnt();
    }

    editProgress() {
        let val = Number.parseInt(this.#view.range.value);
        this.#view.onProgressSet();
        this.#task.setProgress(val);
    }

    editStage(stage: Stage) {
        this.#view.erase();
        this.#task.setStage(stage);
        TaskView.updateCnt();
    }

    /**
     * Equivalent to `editStage(this.#task.stage + 1)`.
     */
    advanceStage() {
        this.editStage(this.#task.stage + 1);
    }

    /**
     * Add task to `Task.tasks` and write back.
     * @param ev event which target is a form
     * @returns false
     */
    static addTask(ev: Event) {
        let form: HTMLFormElement = ev.target as HTMLFormElement;
        let data = new FormData(form);
        let name = data.get('task-name').toString();
        if (name in Task.tasks) {
            alert("Task with the name already exits!")
            return false;
        }
        let newTask = new Task(
            name,
            new Date([
                data.get('due-date').toString(),
                data.get('due-time').toString(),
            ].join(' ')),
            data.get('description').toString(),
            curStage
        );
        Task.insert(newTask);
        TaskView.createView(newTask);
        TaskView.updateCnt();
        return false;
    }

    static changeToStage(stage: Stage) {
        TaskView.changeView(stage);
        curStage = stage;
    }

    static completeTasksOfCurStage() {
        Task.completeTasksOfStage(curStage);
        TaskView.setViewsCompleted();
    }

    static advanceCompleted() {
        if (curStage === Stage.Done) {
            Task.eraseDone();
            TaskView.eraseViews()
        } else {
            Task.moveCompleteTasks(curStage, curStage + 1);
            TaskView.eraseCompletedViews();
        }
        TaskView.updateCnt();
    }

    static doneCompleted() {
        Task.moveCompleteTasks(curStage, Stage.Done);
        TaskView.eraseCompletedViews();
        TaskView.updateCnt();
    }

    static deleteCompleted() {
        Task.eraseCompleteTasksOfStage(curStage);
        TaskView.eraseCompletedViews();
        TaskView.updateCnt();
    }
}

/* manipulation */

/* main */
document.getElementById('new-task').onsubmit = TaskController.addTask;
TaskView.initStageButtons()
TaskView.bindManipulationButtons()
Task.load();
TaskView.changeView(curStage);
TaskView.updateCnt();
