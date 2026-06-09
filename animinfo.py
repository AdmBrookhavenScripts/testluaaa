import struct
import sys

def read_string(f):
    length = struct.unpack("<H", f.read(2))[0]
    return f.read(length).decode("utf-8", errors="replace")

def get_animation_duration(path):
    with open(path, "rb") as f:
        name = read_string(f)

        keyframe_count = struct.unpack("<I", f.read(4))[0]

        duration = 0.0

        for _ in range(keyframe_count):
            time = struct.unpack("<f", f.read(4))[0]
            duration = max(duration, time)

            pose_count = struct.unpack("<I", f.read(4))[0]

            for _ in range(pose_count):
                read_string(f)
                f.read(4)
                read_string(f)
                read_string(f)
                f.read(48)

    return name, duration

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)

    name, duration = get_animation_duration(sys.argv[1])

    print(f"Name: {name}")
    print(f"Duration: {duration:.3f} s")import struct
import sys

def read_string(f):
    length = struct.unpack("<H", f.read(2))[0]
    return f.read(length).decode("utf-8", errors="replace")

def get_animation_duration(path):
    with open(path, "rb") as f:
        name = read_string(f)

        keyframe_count = struct.unpack("<I", f.read(4))[0]

        duration = 0.0

        for _ in range(keyframe_count):
            time = struct.unpack("<f", f.read(4))[0]
            duration = max(duration, time)

            pose_count = struct.unpack("<I", f.read(4))[0]

            for _ in range(pose_count):
                read_string(f)
                f.read(4)
                read_string(f)
                read_string(f)
                f.read(48)

    return name, duration

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)

    name, duration = get_animation_duration(sys.argv[1])

    sys.stdout.write(
    f"Name: {name}\nDuration: {duration:.3f} s"
)
