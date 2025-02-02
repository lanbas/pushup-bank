PRAGMA foreign_keys = ON;

INSERT INTO users(name, balance)
VALUES 
    (
        'Tommy',
        1200
    ),
    (
        'Lance',
        300
    );

INSERT INTO transactions(amount, date, user)
VALUES 
    (
        50,
        '01/15/2025',
        'Tommy'
    ),
    (
        30,
        '01/31/2025',
        'Lance'
    );
