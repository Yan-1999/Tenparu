enum Stage { Backlog, Todo, Doing, Verify, Done }

const STROAGE_KEY = 'tenparu';

var task_template = document.getElementById('task-template') as
    HTMLTemplateElement;
var task_list = document.getElementById('task-list') as HTMLDivElement;
var curStage = Stage.Doing;
var tasks: { [key: string]: Task } = {};

function taskAncestorElement(elem: Element) {
    let e = elem;
    while (e !== document.body) {
        if (e.classList.contains('task')) {
            return (e);
        }
        e = e.parentElement;
    }
    return null;
}

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

function writeBack() {
    window.localStorage.setItem(STROAGE_KEY, JSON.stringify(tasks));
}

class Task {
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

    renderDiv(div: HTMLDivElement) {
        div.setAttribute('data-name', this.name);
        div.getElementsByClassName(
            'task-item-name')[0].textContent = this.name;
        div.getElementsByClassName(
            'task-item-due')[0].textContent = this.due.toLocaleString();
        div.getElementsByClassName(
            'task-item-priority')[0].textContent = this.priority;
        div.getElementsByClassName(
            'task-item-description')[0].textContent = this.description;
        div.getElementsByClassName(
            'task-item-timeleft')[0].textContent = diffTimeStr(this.due);

        (div.getElementsByClassName('task-item-delete')[0] as
            HTMLButtonElement).onclick = this.remove.bind(this);

        let next_button = div.getElementsByClassName('task-item-next')[0] as
            HTMLButtonElement;
        let range = div.getElementsByClassName('task-item-progress')[0] as
            HTMLInputElement
        let stage = this.stage;
        if (stage === Stage.Done) {
            next_button.style.display = 'none';
            range.style.display = 'none';
            div.setAttribute('data-done', '');
        } else {
            next_button.textContent = Stage[stage + 1];
            next_button.onclick = this.advanceStage.bind(this);
            range.onchange = this.setProgress.bind(this);
            range.value = this.progress.toString();
            if (range.value === range.max) {
                div.setAttribute('data-done', '');
            }
        }
    }

    newDiv() {
        let node = task_template.content.querySelector<HTMLDivElement>(
            '.task');
        let new_node = document.importNode(node, true);
        this.renderDiv(new_node);
        return new_node;
    }

    remove(ev: Event) {
        let div = taskAncestorElement(ev.target as HTMLInputElement);
        div.remove();
        delete tasks[this.name];
        writeBack();
    }

    setProgress(ev: Event) {
        let range = ev.target as HTMLInputElement;
        let val = range.value;
        this.progress = Number.parseInt(val);
        let task_div = taskAncestorElement(range);
        if (range.value === range.max) {
            task_div.setAttribute('data-done', '');
        } else {
            task_div.removeAttribute('data-done');
        }
        writeBack();
    }

    setStage(ev: Event, stage: Stage) {
        let div = taskAncestorElement(ev.target as HTMLInputElement);
        div.remove();
        this.stage = stage;
        writeBack();
    }

    advanceStage(ev: Event) {
        this.setStage(ev, this.stage + 1);
    }
}


function addTask(ev: Event) {
    let form: HTMLFormElement = ev.target as HTMLFormElement;
    let data = new FormData(form);
    let name = data.get('task-name').toString();
    if (name in tasks) {
        alert("Task with the name already exits!")
        return false;
    }
    let new_task = new Task(
        name,
        new Date([
            data.get('due-date').toString(),
            data.get('due-time').toString(),
        ].join(' ')),
        data.get('priority').toString(),
        data.get('description').toString(),
        Stage.Doing
    );
    tasks[name] = new_task;
    writeBack();
    let div = new_task.newDiv();
    task_list.appendChild(div);
    return false;
}

function loadTaskList(stage: Stage) {
    task_list.innerHTML = '';
    for (const key in tasks) {
        const task = tasks[key];
        if (task.stage === stage) {
            task_list.appendChild(task.newDiv());
        }
    }
}

function load() {
    if (tasks_str !== null) {
        let raw_list = JSON.parse(window.localStorage.getItem(STROAGE_KEY));
        for (const key in raw_list) {
            const raw = raw_list[key];
            raw.due = new Date(raw.due);
            let task = tasks[key] = new Task();
            Object.assign(task, raw);
        }
    }
}

function changeStage(stage: Stage) {
    loadTaskList(stage);
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

function doneAllCurStage() {
    for (const key in tasks) {
        const task = tasks[key];
        if (task.stage === curStage) {
            task.stage = Stage.Done;
        }
    }

}

/*main*/
document.getElementById('new-task').onsubmit = addTask;
let stages_div = document.getElementById('stages');
for (let index = 0; index <= Stage.Done; index++) {
    const stage_str = Stage[index];
    let anchor = document.createElement('a');
    anchor.setAttribute('herf', '#');
    anchor.id = ['stage-', stage_str.toLowerCase()].join('');
    anchor.textContent = stage_str;
    anchor.onclick = changeStage.bind(null, index);
    stages_div.appendChild(anchor);
}
let tasks_str = window.localStorage.getItem(STROAGE_KEY);
if (tasks_str !== null) {
    tasks = JSON.parse(window.localStorage.getItem(STROAGE_KEY))
}
load();
changeStage(curStage);
