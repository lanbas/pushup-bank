# pushup-bank \[WIP\]
Online dashboard to track daily push-up challenge and per-user "banked" pushups/transactions. Developed and tested on Ubuntu 22.04 and Python 3.10.12

~[Main landing page of push-up bank website](./img/dashboard.png)

#### Setup Environment

```
git clone git@github.com:lanbas/pushup-bank.git
cd pushup-bank
```

#### Setup virtual environment
```
python3 -m venv env
source env/bin/activate
```

#### Install dependencies via ```pip```
```
python3 -m pip install -r requirements.txt
```

### Test Installation
Once the dependencies have been installed, the follow command should run the server: 
```
fastapi dev server.py
```

The server will be accessible on http://localhost:8000/home.

### Accessing from a alternate devices
Run the server under production settings: 
```
fastapi run src/server.py
```

The server will be accessible from another device on http://<host computer's IP>:8000/home