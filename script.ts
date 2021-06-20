enum Stage { Backlog, Todo, InProgress, Verify, Done }

const STROAGE_KEY = 'tenparu';

var taskTemplate = (document.getElementById('task-template') as
    HTMLTemplateElement).content.querySelector<HTMLDivElement>(
        '.task');
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

    name: string;
    due: Date;
    priority: string;
    description: string;
    stage: Stage;
    progress: number = 0;

    constructor(name?: string,
        due?: Date,
        priority?: string,
        description?: string,
        stage?: Stage) {
        this.name = name;
        this.due = due;
        this.priority = priority;
        this.description = description;
        this.stage = stage;
    }
    /**
     * Load Task.tasks form `localStorage` to `Task.tasks`.
     */
    static load() {
        let tasksStr = window.localStorage.getItem(STROAGE_KEY);
        if (tasksStr !== null) {
            let raw_list = JSON.parse(tasksStr);
            for (const key in raw_list) {
                const raw = raw_list[key];
                raw.due = new Date(raw.due);
                let task = Task.tasks[key] = new Task();
                Object.assign(task, raw);
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
        this.stage = stage;
        Task.store();
    }

    static insert(task: Task) {
        Task.tasks[task.name] = task;
        Task.store();
    }

    static erase(task: Task) {
        delete Task.tasks[task.name];
        Task.store();
    }
}

class TaskView {
    static taskList = document.getElementById('task-list') as HTMLDivElement;

    _div:HTMLDivElement;
    range: HTMLInputElement;
    _next_button: HTMLButtonElement;

    /**
     * USE `TaskView.create()` TO CREATE A VIEW.
     */
    constructor(div: HTMLDivElement) {
        this._div = div;
    }

    /**
     * Render new `.task` div using `this`, and set events.
     * @param div div to render
     */
    _renderDiv(task: Task) {
        this._div.setAttribute('data-name', task.name);
        this._div.getElementsByClassName(
            'task-item-name')[0].textContent = task.name;
        this._div.getElementsByClassName(
            'task-item-due')[0].textContent = task.due.toLocaleString();
        this._div.getElementsByClassName(
            'task-item-priority')[0].textContent = task.priority;
        this._div.getElementsByClassName(
            'task-item-description')[0].textContent = task.description;
        this._div.getElementsByClassName(
            'task-item-timeleft')[0].textContent = diffTimeStr(task.due);
        this._next_button = this._div.getElementsByClassName('task-item-next')[0] as
            HTMLButtonElement;
        this.range = this._div.getElementsByClassName('task-item-progress')[0] as
            HTMLInputElement
        let stage = task.stage;
        if (stage === Stage.Done) {
            this._next_button.style.display = 'none';
            this.range.style.display = 'none';
            this._div.setAttribute('data-done', '');
        } else {
            this._next_button.textContent = Stage[stage + 1];
            this.range.value = task.progress.toString();
            if (this.range.value === this.range.max) {
                this._div.setAttribute('data-done', '');
            }
        }
    }

    _bindController(task: Task) {
        let controller = new TaskController(task, this);

        (this._div.getElementsByClassName('task-item-delete')[0] as
            HTMLButtonElement).onclick = controller.erase.bind(controller);
        if (task.stage !== Stage.Done) {
            this._next_button.onclick = controller.advanceStage.bind(controller);
            this.range.onchange = controller.editProgress.bind(controller);
        }
    }

    onProgressSet() {
        if (this.range.value === this.range.max) {
            this._div.setAttribute('data-done', '');
        } else {
            this._div.removeAttribute('data-done');
        }
    }

    erase() {
        this._div.remove();
    }

    static createView(task: Task) {
        let div = document.importNode(taskTemplate, true);
        let view = new TaskView(div);
        view._renderDiv(task);
        view._bindController(task);
        TaskView.taskList.appendChild(view._div);
        return view;
    }

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

    /**
     * Change current stage.
     * @param stage stage changing to
     */
    static changeViewToStage(stage: Stage) {
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
        curStage = stage;
    }
}

class TaskController {

    _task: Task;
    _view: TaskView;

    constructor(task: Task, view: TaskView) {
        this._task = task;
        this._view = view;
    }

    erase() {
        this._view.erase();
        Task.erase(this._task);
    }

    editProgress() {
        let val = Number.parseInt(this._view.range.value);
        this._view.onProgressSet();
        this._task.setProgress(val);
    }

    editStage(stage: Stage) {
        this._view.erase();
        this._task.setStage(stage);
    }

    /**
     * Equivalent to `editStage(this._task.stage + 1)`.
     */
    advanceStage() {
        this.editStage(this._task.stage + 1);
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
            data.get('priority').toString(),
            data.get('description').toString(),
            curStage
        );
        Task.insert(newTask);
        TaskView.createView(newTask);
        return false;
    }
}

/* manipulation */

/* main */
document.getElementById('new-task').onsubmit = TaskController.addTask;
let stages_div = document.getElementById('stages');
for (let index = 0; index <= Stage.Done; index++) {
    const stage_str = Stage[index];
    let anchor = document.createElement('button');
    anchor.id = ['stage-', stage_str.toLowerCase()].join('');
    anchor.textContent = stage_str;
    anchor.onclick = TaskView.changeViewToStage.bind(null, index);
    stages_div.appendChild(anchor);
}
Task.load();
TaskView.changeViewToStage(curStage);
